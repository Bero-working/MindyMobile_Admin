import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import BlobUtil from 'react-native-blob-util';
import Pdf from 'react-native-pdf';
import Video, { type VideoRef } from 'react-native-video';
import { WebView } from 'react-native-webview';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Alert, Button, Text } from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Page } from '@/modules/attendance/components/shared';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useMindyTheme } from '@/components/ui/theme';
import { useMaterials } from './MaterialProvider';
import { useRead } from './hooks';
import { ReadBlock } from './components';
import { MaterialError } from './service';
import { escapeHtml } from './model';
const styles = StyleSheet.create({
  image: { height: 440, width: '100%' },
  viewer: { height: 480, width: '100%' },
});
function ZoomImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1),
    start = useSharedValue(1);
  const pinch = Gesture.Pinch()
    .onStart(() => {
      start.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(4, Math.max(1, start.value * e.scale));
    });
  const reset = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
    });
  const transform = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, reset)}>
      <Animated.View style={transform}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Material image"
        />
      </Animated.View>
    </GestureDetector>
  );
}
export function MaterialPreviewScreen({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParams, 'MaterialPreview'>) {
  const { materialId, revision, fileId, classId, title } = route.params;
  const { t } = useTranslation('materials');
  const { state } = useAuth();
  const service = useMaterials();
  const { colors } = useMindyTheme();
  const focused = useIsFocused();
  const scope = {
    role:
      state.user?.role === 'MENTOR'
        ? ('MENTOR' as const)
        : ('MANAGER' as const),
    classId,
  };
  const paths = useRef<string[]>([]),
    sequence = useRef(0),
    video = useRef<VideoRef>(null),
    position = useRef(0),
    attempts = useRef(0),
    renewing = useRef(false);
  const [link, setLink] = useState(''),
    [videoUrl, setVideoUrl] = useState(''),
    [failed, setFailed] = useState(false),
    [pdfPage, setPdfPage] = useState('');
  const download = useRef<ReturnType<typeof BlobUtil.fetch> | undefined>(
    undefined
  );
  useEffect(() => {
    if (focused) return;
    sequence.current++;
    download.current?.cancel();
    setVideoUrl('');
    for (const p of paths.current) BlobUtil.fs.unlink(p).catch(() => {});
    paths.current = [];
  }, [focused]);
  useEffect(
    () => () => {
      sequence.current++;
      download.current?.cancel();
      for (const p of paths.current) BlobUtil.fs.unlink(p).catch(() => {});
    },
    []
  );
  const query = useRead(
    `preview:${scope.role}:${classId}:${materialId}:${revision}:${fileId}`,
    async () => {
      const token = ++sequence.current;
      setFailed(false);
      setVideoUrl('');
      const m = await service.detail(scope, materialId);
      if (m.revision !== revision) throw new MaterialError('conflict');
      if (m.contentType === 'ARTICLE' && !fileId) {
        let html = m.contentHtml ?? '';
        const origins = new Set<string>();
        let partial = false;
        for (let start = 0; start < m.inlineImages.length; start += 4) {
          const batch = await Promise.all(
            m.inlineImages.slice(start, start + 4).map(async (f) => {
              try {
                const result = await service.access(
                  scope,
                  materialId,
                  revision,
                  f.id
                );
                return { id: f.id, url: result.url };
              } catch (e) {
                if (
                  e instanceof MaterialError &&
                  ['denied', 'notFound', 'conflict'].includes(e.kind)
                )
                  throw e;
                partial = true;
                return { id: f.id, url: '' };
              }
            })
          );
          for (const f of batch) {
            if (f.url) origins.add(new URL(f.url).origin);
            html = html.replace(/<img\b[^>]*>/gi, (tag) =>
              new RegExp(`data-file-id=["']${f.id}["']`, 'i').test(tag)
                ? tag
                    .replace(/\s+src\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
                    .replace(/>$/, f.url ? ` src="${escapeHtml(f.url)}">` : '>')
                : tag
            );
          }
        }
        const csp = `default-src 'none'; img-src ${[...origins].join(' ') || "'none'"}; style-src 'unsafe-inline'`;
        return {
          m,
          html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}"><style>body{font:15px/1.6 sans-serif;color:${colors.ink};background:${colors.bg};padding:12px}img,table{max-width:100%}pre{white-space:pre-wrap}table{overflow-wrap:anywhere}</style></head><body>${html}</body></html>`,
          partial,
          local: '',
          external: false,
          file: undefined,
        };
      }
      const f = fileId
        ? [m.file, ...m.attachments, ...m.inlineImages].find(
            (candidate) => candidate?.id === fileId
          )
        : m.file;
      if (!f) throw new MaterialError('notFound');
      const external =
        m.attachments.some((a) => a.id === f.id) ||
        !['PDF', 'IMAGE', 'VIDEO'].includes(f.kind);
      if (external)
        return { m, file: f, external, local: '', html: '', partial: false };
      const access = await service.access(scope, materialId, revision, f.id);
      if (token !== sequence.current) throw new MaterialError('error');
      if (f.kind === 'VIDEO') {
        setVideoUrl(access.url);
        attempts.current = 0;
        return { m, file: f, external, local: '', html: '', partial: false };
      }
      const path = `${BlobUtil.fs.dirs.CacheDir}/mindy-preview-${Date.now()}-${f.id}.${f.kind === 'PDF' ? 'pdf' : 'img'}`;
      paths.current.push(path);
      download.current = BlobUtil.config({
        path,
        followRedirect: false,
        timeout: 60000,
      }).fetch('GET', access.url, {});
      const result = await download.current;
      if (token !== sequence.current) {
        BlobUtil.fs.unlink(path).catch(() => {});
        throw new MaterialError('error');
      }
      if (result.info().status !== 200) {
        BlobUtil.fs.unlink(path).catch(() => {});
        throw new MaterialError('error', 'cannotOpen');
      }
      return {
        m,
        file: f,
        external,
        local: `file://${path}`,
        html: '',
        partial: false,
      };
    },
    focused
  );
  const data = query.data;
  const renewVideo = async () => {
    if (renewing.current || !query.online || attempts.current >= 3) {
      setFailed(true);
      return;
    }
    renewing.current = true;
    attempts.current++;
    try {
      const next = await service.access(scope, materialId, revision, fileId);
      if (focused) setVideoUrl(next.url);
    } catch {
      setVideoUrl('');
      setFailed(true);
      await query.refresh();
    } finally {
      renewing.current = false;
    }
  };
  return (
    <Page
      prefix="preview"
      title={title}
      subtitle={`${t('revision')} ${revision}`}
      onBack={() => navigation.goBack()}
      showMockControls={false}
    >
      <ReadBlock
        data={focused ? data : undefined}
        busy={query.busy}
        error={query.error}
        retry={() => {
          query.refresh();
        }}
      >
        {focused && data && (
          <>
            {data.partial && (
              <Alert
                testID="material-warning"
                warning
              >
                {t('partialImages')}
              </Alert>
            )}
            {data.html ? (
              <WebView
                testID="preview-article"
                source={{ html: data.html }}
                style={styles.viewer}
                javaScriptEnabled={false}
                sharedCookiesEnabled={false}
                thirdPartyCookiesEnabled={false}
                incognito
                cacheEnabled={false}
                allowFileAccess={false}
                allowFileAccessFromFileURLs={false}
                allowUniversalAccessFromFileURLs={false}
                mixedContentMode="never"
                originWhitelist={['*']}
                onShouldStartLoadWithRequest={(r) => {
                  if (r.url === 'about:blank') return true;
                  if (/^(https?:|mailto:)/i.test(r.url)) setLink(r.url);
                  return false;
                }}
              />
            ) : data.external ? (
              <Button
                testID="preview-open-external"
                disabled={!query.online}
                onPress={async () => {
                  try {
                    const a = await service.access(
                      scope,
                      materialId,
                      revision,
                      data.file!.id
                    );
                    await Linking.openURL(a.url);
                  } catch {
                    setFailed(true);
                  }
                }}
              >
                {t('external')}
              </Button>
            ) : data.file?.kind === 'VIDEO' ? (
              videoUrl && (
                <Video
                  ref={video}
                  testID="preview-video"
                  source={{ uri: videoUrl, headers: {} }}
                  style={styles.viewer}
                  controls
                  paused={!focused || !query.online}
                  onLoad={() => {
                    video.current?.seek(position.current);
                  }}
                  onProgress={(e) => {
                    if (e.currentTime > position.current + 1)
                      attempts.current = 0;
                    position.current = e.currentTime;
                  }}
                  onError={() => {
                    renewVideo();
                  }}
                />
              )
            ) : data.file?.kind === 'PDF' ? (
              <>
                <Text>{pdfPage}</Text>
                <Pdf
                  source={{ uri: data.local, cache: false }}
                  style={styles.viewer}
                  trustAllCerts={false}
                  onPageChanged={(p, total) => setPdfPage(`${p}/${total}`)}
                  onError={() => setFailed(true)}
                />
              </>
            ) : (
              <ZoomImage uri={data.local} />
            )}
          </>
        )}
      </ReadBlock>
      {failed && (
        <>
          <Alert
            testID="material-warning"
            warning
          >
            {t('cannotOpen')}
          </Alert>
          {query.online && (
            <Button
              onPress={() => {
                query.refresh();
              }}
            >
              {t('retry')}
            </Button>
          )}
        </>
      )}
      {link && (
        <ConfirmationDialog
          testID="preview-link-dialog"
          title={t('openLink')}
          onClose={() => setLink('')}
        >
          <Text>{link}</Text>
          <Button
            onPress={() => {
              Linking.openURL(link).catch(() => setFailed(true));
              setLink('');
            }}
          >
            {t('confirm')}
          </Button>
          <Button
            variant="text"
            onPress={() => setLink('')}
          >
            {t('cancel')}
          </Button>
        </ConfirmationDialog>
      )}
    </Page>
  );
}
