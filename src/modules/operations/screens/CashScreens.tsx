import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  Avatar,
  Button,
  Card,
  CircleIcon,
  Icon,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { useOperationsQuery } from '../hooks';
import { useOperations } from '../provider';
import { canCollect, formatMoney, moneyValue } from '../model';
import type { Order, Result } from '../types';
import {
  Alert,
  Page,
  Field,
  QueryState,
  More,
  MoneyText,
  OrderStatusChip,
  isOrderOverdue,
  isoDate,
  isoTime,
} from '../components/shared';

const statuses = ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'];

function DetailSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <View className="gap-space-10">
      <Text
        accessibilityRole="header"
        className="text-size-15 font-bvp-semibold"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  testID,
}: {
  label: string;
  value: string;
  testID?: string;
}) {
  return (
    <View
      {...(testID ? { testID } : {})}
      accessible
      className="flex-row justify-between gap-space-16"
    >
      <Text className="text-size-13 text-mdy-secondary">{label}</Text>
      <Text className="flex-1 text-right text-size-13 font-bvp-medium">
        {value}
      </Text>
    </View>
  );
}

function ClassOption({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-space-48 flex-row items-center gap-space-12 rounded-radius-14 px-space-12 py-space-10 active:opacity-80 ${selected ? 'bg-mdy-tint2' : ''}`}
    >
      <Text
        numberOfLines={2}
        className={`flex-1 ${selected ? 'font-bvp-semibold text-mdy-link' : ''}`}
      >
        {label}
      </Text>
      {selected && (
        <Icon
          name="check"
          size={18}
        />
      )}
    </Pressable>
  );
}

function CashOrderRow({
  order,
  asOf,
  onPress,
}: {
  order: Order;
  asOf: string;
  onPress: () => void;
}) {
  const { t } = useTranslation('operations');
  const { colors } = useMindyTheme();
  const name = order.student.displayName ?? t('cash.noName');
  const overdue = isOrderOverdue(order, asOf);
  const at = order.paidAt ?? order.expiresAt;
  const deadline =
    order.status === 'CANCELLED'
      ? ''
      : t(
          order.status === 'PAID'
            ? order.confirmedBy
              ? 'cash.paidBy'
              : 'cash.paid'
            : order.status === 'EXPIRED'
              ? 'cash.expiredAt'
              : 'cash.due',
          {
            time: `${isoTime(at)} ${isoDate(at).slice(0, 5)}`,
            name: order.confirmedBy?.displayName ?? t('cash.noName'),
          }
        );
  return (
    <Pressable
      testID={`cash-list-row-${order.id}`}
      accessibilityRole="button"
      accessibilityLabel={[
        order.orderCode,
        name,
        `${order.totalAmount} đồng`,
        t(`status.${overdue ? 'overdue' : order.status}`),
        ...(deadline ? [deadline] : []),
      ].join(', ')}
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card className="mx-space-0 px-space-20 py-space-16 gap-space-12">
        <View className="flex-row items-start gap-space-12">
          <View className="flex-1 gap-space-3">
            <Text
              numberOfLines={2}
              className="text-size-15 font-bvp-semibold text-mdy-ink"
            >
              {name}
            </Text>
            <Text className="text-size-12 text-mdy-tertiary">
              {order.orderCode}
            </Text>
          </View>
          <OrderStatusChip
            order={order}
            asOf={asOf}
            testID={`cash-list-row-${order.id}-status`}
          />
        </View>
        <View className="h-[1px] bg-mdy-divider" />
        <View className="flex-row items-center gap-space-12">
          <View className="flex-1 gap-space-4">
            {!!deadline && (
              <View className="flex-row items-center gap-space-6">
                <Icon
                  name="schedule"
                  size={14}
                  {...(overdue ? { color: colors.danger } : {})}
                />
                <Text
                  testID={`cash-list-row-${order.id}-deadline`}
                  className={`shrink text-size-13 ${overdue ? 'text-mdy-danger' : 'text-mdy-secondary'}`}
                >
                  {deadline}
                </Text>
              </View>
            )}
            <Text className="text-size-12 text-mdy-tertiary">
              {t('cash.created', { date: isoDate(order.createdAt) })}
            </Text>
          </View>
          <MoneyText
            value={order.totalAmount}
            testID={`cash-list-row-${order.id}-amount`}
          />
        </View>
      </Card>
    </Pressable>
  );
}

export function CashOrdersScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'CashOrders'>) {
  const { t } = useTranslation('operations');
  const { colors } = useMindyTheme();
  const [status, setStatus] = useState('PENDING'),
    [input, setInput] = useState(''),
    [code, setCode] = useState('');
  const [classId, setClassId] = useState<string>(),
    [className, setClassName] = useState(''),
    [sheet, setSheet] = useState(false),
    [classSearch, setClassSearch] = useState(''),
    [classTerm, setClassTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setClassTerm(classSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [classSearch]);
  const query = useOperationsQuery({
    kind: 'orders',
    ...(code
      ? { orderCode: code }
      : { status, ...(classId ? { classId } : {}) }),
  });
  const classes = useOperationsQuery(
    { kind: 'classes', search: classTerm },
    sheet
  );
  const { height } = useWindowDimensions();
  const clearClass = () => {
    setClassId(undefined);
    setClassName('');
  };
  const closeSheet = () => {
    setSheet(false);
    setClassSearch('');
    setClassTerm('');
  };
  return (
    <Page
      prefix="cash-list"
      showMockControls={false}
      title={t('cash.title')}
      onBack={navigation.goBack}
      refresh={query.refresh}
    >
      <View className="gap-space-12">
        <View className="flex-row items-center gap-space-8 rounded-radius-99 border border-mdy-border bg-mdy-surface pl-space-16 pr-space-4">
          <Icon
            name="search"
            size={18}
          />
          <TextInput
            testID="cash-list-search"
            accessibilityLabel={t('cash.search')}
            placeholder={t('cash.search')}
            placeholderTextColor={colors.placeholder}
            value={input}
            onChangeText={(v) => {
              setInput(v.toUpperCase());
              if (!v) setCode('');
            }}
            maxLength={50}
            returnKeyType="search"
            autoCapitalize="characters"
            onSubmitEditing={() => setCode(input.trim().toUpperCase())}
            editable={!query.offline}
            className="flex-1 min-h-space-52 text-size-14 font-bvp-regular text-mdy-ink"
          />
          {!!input && (
            <Pressable
              testID="cash-list-search-clear"
              accessibilityRole="button"
              accessibilityLabel={t('cash.clearSearch')}
              onPress={() => {
                setInput('');
                setCode('');
              }}
              className="h-space-44 w-space-44 items-center justify-center active:opacity-80"
            >
              <Icon
                name="close"
                size={18}
              />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-space-24"
          contentContainerClassName="px-space-24"
        >
          <View
            className={`flex-row gap-space-8 ${code ? 'opacity-50' : ''}`}
            accessibilityRole="radiogroup"
          >
            {statuses.map((value) => (
              <Pressable
                key={value}
                testID={`cash-list-status-${value.toLowerCase()}`}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: status === value,
                  disabled: !!code,
                }}
                disabled={!!code}
                onPress={() => setStatus(value)}
                className={
                  status === value
                    ? 'min-h-space-44 rounded-radius-99 px-space-16 justify-center bg-mdy-primary'
                    : 'min-h-space-44 rounded-radius-99 px-space-16 justify-center border border-mdy-border bg-mdy-surface'
                }
              >
                <Text
                  className={
                    status === value
                      ? 'text-size-13 font-bvp-semibold text-mdy-onBrand'
                      : 'text-size-13 text-mdy-link'
                  }
                >
                  {t(`status.${value}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View
          className={`flex-row items-center gap-space-8 ${code || query.offline ? 'opacity-50' : ''}`}
        >
          <Pressable
            testID="cash-list-class"
            accessibilityRole="button"
            accessibilityState={{ disabled: !!code || query.offline }}
            disabled={!!code || query.offline}
            onPress={() => setSheet(true)}
            className="shrink min-h-space-44 flex-row items-center gap-space-6 rounded-radius-99 border border-mdy-border bg-mdy-surface px-space-16 active:opacity-80"
          >
            <Icon
              name="school"
              size={16}
            />
            <Text
              numberOfLines={1}
              className="shrink text-size-13 text-mdy-link"
            >
              {className || t('cash.allClasses')}
            </Text>
            <Icon
              name="expand_more"
              size={16}
            />
          </Pressable>
          {classId && (
            <Pressable
              testID="cash-list-class-clear"
              accessibilityRole="button"
              accessibilityLabel={t('cash.clearClass')}
              disabled={!!code}
              onPress={clearClass}
              className="h-space-44 w-space-44 items-center justify-center active:opacity-80"
            >
              <Icon
                name="close"
                size={18}
              />
            </Pressable>
          )}
        </View>
      </View>
      <QueryState
        query={query}
        prefix="cash-list"
      >
        <View className="gap-space-12">
          <Text
            testID="cash-list-count"
            className="text-size-12 font-bvp-semibold text-mdy-secondary"
          >
            {t('cash.count', { count: query.data?.total })}
          </Text>
          {query.data?.orders?.map((order) => (
            <CashOrderRow
              key={order.id}
              order={order}
              asOf={query.data!.asOf}
              onPress={() =>
                navigation.navigate('CashOrderDetail', {
                  orderId: order.id,
                  orderCode: order.orderCode,
                })
              }
            />
          ))}
          {query.data?.total === 0 && (
            <Card
              center
              testID={code ? 'cash-list-not-found' : 'cash-list-empty'}
              className="mx-space-0 px-space-24 py-space-24 gap-space-12"
            >
              <CircleIcon name="receipt_long" />
              <Text className="text-size-14 text-center text-mdy-secondary">
                {t(
                  code
                    ? 'cash.notFound'
                    : status === 'PENDING'
                      ? 'cash.emptyPending'
                      : 'cash.empty'
                )}
              </Text>
              {!code && classId && (
                <Button
                  testID="cash-list-empty-clear-class"
                  variant="text"
                  size="sm"
                  onPress={clearClass}
                >
                  {t('cash.clearClass')}
                </Button>
              )}
            </Card>
          )}
          <More
            query={query}
            prefix="cash-list"
          />
        </View>
      </QueryState>
      {sheet && (
        <Sheet
          testID="cash-list-class-sheet"
          title={t('cash.pickClass')}
          onClose={closeSheet}
        >
          <Field
            id="cash-list-class-search"
            label={t('cash.searchClass')}
            value={classSearch}
            onChange={setClassSearch}
            multiline={false}
          />
          <ScrollView
            testID="cash-list-class-list"
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: height * 0.5 }}
            contentContainerClassName="gap-space-4"
          >
            <QueryState
              query={classes}
              prefix="cash-list-classes"
            >
              {!classSearch.trim() && (
                <ClassOption
                  testID="cash-list-class-all"
                  label={t('cash.allClasses')}
                  selected={!classId}
                  onPress={() => {
                    clearClass();
                    closeSheet();
                  }}
                />
              )}
              {classes.data?.classes?.map((item) => (
                <ClassOption
                  key={item.id}
                  testID={`cash-list-class-${item.id}`}
                  label={item.name}
                  selected={item.id === classId}
                  onPress={() => {
                    setClassId(item.id);
                    setClassName(item.name);
                    closeSheet();
                  }}
                />
              ))}
              {classes.data?.total === 0 && (
                <Text
                  testID="cash-list-classes-empty"
                  className="py-space-12 text-center text-size-13 text-mdy-secondary"
                >
                  {t('cash.noClasses')}
                </Text>
              )}
              <More
                query={classes}
                prefix="cash-list-classes"
              />
            </QueryState>
          </ScrollView>
        </Sheet>
      )}
    </Page>
  );
}

export function CashOrderDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'CashOrderDetail'>) {
  const { t } = useTranslation('operations');
  const { colors } = useMindyTheme();
  const { state, notify } = useAuth();
  const { source, send, settle } = useOperations();
  const query = useOperationsQuery({ kind: 'order', id: route.params.orderId });
  const [snapshot, setSnapshot] = useState<{ order: Order; asOf: string }>();
  const order = snapshot?.order ?? query.data?.order,
    asOf = snapshot?.asOf ?? query.data?.asOf ?? '';
  const [sheet, setSheet] = useState(false),
    [amount, setAmount] = useState(''),
    [invalid, setInvalid] = useState(false),
    [busy, setBusy] = useState(false),
    [unknown, setUnknown] = useState(false);
  const [retryAllowed, setRetryAllowed] = useState(false),
    [notice, setNotice] = useState(''),
    [fatal, setFatal] = useState<'denied' | 'notFound'>(),
    [collectorUnknown, setCollectorUnknown] = useState(false);
  const pending = useRef(false),
    alive = useRef(true),
    received = useRef<number | null>(null),
    amountRef = useRef<TextInput>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (query.data?.order && !pending.current)
      setSnapshot({ order: query.data.order, asOf: query.data.asOf });
  }, [query.data]);
  const clearDenied = (value: Result | undefined) => {
    if (value?.kind === 'denied' || value?.kind === 'notFound') {
      setFatal(value.kind);
      setSnapshot(undefined);
      setAmount('');
      setSheet(false);
      setUnknown(false);
    }
  };
  const read = async () => {
    const result = source
      ? await source.read({ kind: 'order', id: route.params.orderId })
      : undefined;
    if (!alive.current) return undefined;
    clearDenied(result);
    if (result?.kind === 'success' && result.data.order) {
      setSnapshot({ order: result.data.order, asOf: result.data.asOf });
      return { order: result.data.order, asOf: result.data.asOf };
    }
    return undefined;
  };
  const reconcile = async (fallback?: Order, fromUnknown = false) => {
    setRetryAllowed(false);
    const current = await read();
    if (!alive.current) return;
    if (!current) {
      if (fallback?.status === 'PAID') {
        setSnapshot({
          order: { ...fallback, student: order?.student ?? fallback.student },
          asOf,
        });
        setCollectorUnknown(true);
        setSheet(false);
        setUnknown(false);
        setAmount('');
      } else setUnknown(true);
      return;
    }
    if (current.order.status === 'PAID') {
      settle(current.order.id);
      setUnknown(false);
      setSheet(false);
      setAmount('');
      const by = current.order.confirmedBy;
      if (!by) setCollectorUnknown(true);
      else if (by.id === state.user?.id) {
        setNotice('');
        notify(
          t(fromUnknown ? 'cashDetail.recorded' : 'cashDetail.done', {
            amount: formatMoney(current.order.totalAmount),
          })
        );
      } else setNotice('cashDetail.alreadyByOther');
    } else if (canCollect(current.order, current.asOf)) {
      setUnknown(true);
      setRetryAllowed(true);
    } else {
      setSheet(false);
      setUnknown(false);
      setAmount('');
    }
  };
  const open = async () => {
    if (pending.current || query.offline) return;
    pending.current = true;
    setBusy(true);
    setNotice('');
    const current = await read();
    if (alive.current) {
      if (!current) setNotice('cashDetail.notChecked');
      else if (
        !canCollect(current.order, current.asOf) ||
        current.order.totalAmount !== order?.totalAmount
      )
        setNotice('cashDetail.changed');
      else {
        setAmount('');
        setInvalid(false);
        setSheet(true);
        setUnknown(false);
      }
      setBusy(false);
    }
    pending.current = false;
  };
  const collect = async (retry = false) => {
    if (!order || pending.current || query.offline || fatal) return;
    const value = retry ? received.current : moneyValue(amount);
    if (!value || value !== order.totalAmount) {
      setInvalid(true);
      amountRef.current?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    received.current = value;
    setRetryAllowed(false);
    const result = await send({
      kind: 'collect',
      id: order.id,
      receivedAmount: value,
    });
    if (!alive.current) {
      pending.current = false;
      return;
    }
    clearDenied(result);
    if (result.kind === 'success') await reconcile(result.data.order);
    else if (result.kind === 'uncertain') {
      setUnknown(true);
      await reconcile(undefined, true);
    } else if (result.kind !== 'denied' && result.kind !== 'notFound') {
      const current = await read();
      if (result.code === 'CASH_CONFIRMATION_INVALID') {
        setAmount('');
        setNotice(
          current?.order.status === 'PAID'
            ? 'cashDetail.paidMismatch'
            : 'cashDetail.amountInvalid'
        );
        if (current?.order.status === 'PAID') setSheet(false);
      } else {
        setSheet(false);
        setAmount('');
        setNotice(
          result.code === 'CASH_HOLD_INVALID'
            ? 'cashDetail.holdInvalid'
            : result.code === 'CASH_ORDER_CLOSED'
              ? 'cashDetail.closed'
              : 'error'
        );
      }
    }
    if (alive.current) setBusy(false);
    pending.current = false;
  };
  const recheck = useCallback(async () => {
    if (pending.current || query.offline) return;
    pending.current = true;
    setBusy(true);
    await reconcile(undefined, true);
    if (alive.current) setBusy(false);
    pending.current = false;
  }, [query.offline, source, order?.id]);
  useEffect(() => {
    if (unknown && !query.offline) recheck();
  }, [query.offline]);
  useFocusEffect(
    useCallback(() => {
      if (unknown && !query.offline) recheck();
    }, [query.offline])
  );
  const available = !!order && canCollect(order, asOf);
  useEffect(() => {
    clearDenied(query.result);
  }, [query.result?.kind]);
  const error = ['error', 'denied', 'notFound'].includes(
    query.result?.kind ?? ''
  );
  const collector = order?.confirmedBy;
  const overdue = !!order && isOrderOverdue(order, asOf);
  const close = () => {
    if (!busy && !unknown) {
      setSheet(false);
      setAmount('');
    }
  };
  const dangerNotice = [
    'cashDetail.closed',
    'cashDetail.holdInvalid',
    'cashDetail.paidMismatch',
  ].includes(notice);
  return (
    <Page
      prefix="cash-detail"
      showMockControls={false}
      title={t('cashDetail.title')}
      subtitle={route.params.orderCode ?? order?.orderCode}
      onBack={navigation.goBack}
      dirty={!!amount}
      busy={busy}
      uncertain={unknown}
      refresh={query.refresh}
      footer={
        !fatal &&
        available &&
        !dangerNotice &&
        !unknown &&
        !sheet && (
          <Button
            testID="cash-detail-confirm"
            disabled={query.offline || error || busy}
            busy={busy}
            onPress={open}
          >
            {t('cashDetail.confirm')}
          </Button>
        )
      }
    >
      {fatal ? (
        <Card
          testID={`cash-detail-${fatal === 'denied' ? 'denied' : 'not-found'}`}
          className="mx-space-0"
        >
          <Text>{t(fatal)}</Text>
        </Card>
      ) : (
        <QueryState
          query={query}
          prefix="cash-detail"
        >
          {order &&
            (order.paymentType !== 'CASH' ? (
              <Card
                testID="cash-detail-not-cash"
                className="mx-space-0"
              >
                <Text>{t('cashDetail.notCash')}</Text>
              </Card>
            ) : (
              <>
                {notice && (
                  <Alert
                    testID={
                      notice === 'cashDetail.alreadyByOther'
                        ? 'cash-detail-by-other'
                        : notice === 'cashDetail.notChecked'
                          ? 'cash-detail-not-checked'
                          : notice === 'cashDetail.changed'
                            ? 'cash-detail-changed'
                            : notice === 'cashDetail.closed'
                              ? 'cash-detail-closed'
                              : notice === 'cashDetail.holdInvalid'
                                ? 'cash-detail-hold-invalid'
                                : notice === 'cashDetail.paidMismatch'
                                  ? 'cash-detail-paid-mismatch'
                                  : 'cash-detail-amount-invalid'
                    }
                    warning={!dangerNotice}
                  >
                    {t(notice, {
                      name: collector?.displayName ?? t('cash.noName'),
                      time: order.paidAt
                        ? `${isoTime(order.paidAt)} ${isoDate(order.paidAt)}`
                        : '',
                    })}
                    {dangerNotice && <Text>{t('cashDetail.tellOwner')}</Text>}
                  </Alert>
                )}
                <Card className="mx-space-0 px-space-20 py-space-20 gap-space-12">
                  <View className="gap-space-4">
                    <View className="flex-row items-center justify-between gap-space-12">
                      <Text className="shrink text-size-13 text-mdy-secondary">
                        {t(
                          order.status === 'PAID'
                            ? 'cashDetail.collected'
                            : available
                              ? 'cashDetail.due'
                              : 'cashDetail.amount'
                        )}
                      </Text>
                      <OrderStatusChip
                        order={order}
                        asOf={asOf}
                        testID="cash-detail-status"
                      />
                    </View>
                    <MoneyText
                      value={order.totalAmount}
                      large
                      testID="cash-detail-amount"
                    />
                  </View>
                  <View className="h-[1px] bg-mdy-divider" />
                  <View className="flex-row items-start gap-space-6">
                    <Icon
                      name="schedule"
                      size={14}
                      {...(overdue ? { color: colors.danger } : {})}
                    />
                    <Text
                      testID="cash-detail-deadline"
                      className={`shrink text-size-13 ${overdue ? 'text-mdy-danger' : 'text-mdy-secondary'}`}
                    >
                      {t(
                        order.status === 'CANCELLED'
                          ? 'cashDetail.cancelled'
                          : order.status === 'EXPIRED'
                            ? 'cashDetail.expired'
                            : order.status === 'PAID'
                              ? 'cashDetail.paidAt'
                              : available
                                ? 'cashDetail.holdUntil'
                                : 'cashDetail.holdPassed',
                        {
                          time: `${isoTime(order.paidAt ?? order.expiresAt)} ${isoDate(order.paidAt ?? order.expiresAt)}`,
                        }
                      )}
                    </Text>
                  </View>
                  {order.status === 'PAID' && collector && (
                    <Text
                      testID="cash-detail-collector"
                      className="text-size-13"
                    >
                      {t(
                        collector.source === 'LEGACY_MENTOR'
                          ? 'cashDetail.byLegacy'
                          : collector.id === state.user?.id
                            ? 'cashDetail.byMe'
                            : 'cashDetail.byOther',
                        { name: collector.displayName ?? t('cash.noName') }
                      )}
                    </Text>
                  )}
                  {collectorUnknown && (
                    <>
                      <Text className="text-size-13">
                        {t('cashDetail.collectorUnknown')}
                      </Text>
                      {!query.offline && (
                        <Button
                          testID="cash-detail-collector-retry"
                          variant="secondary"
                          onPress={async () => {
                            const current = await read();
                            if (current?.order.confirmedBy)
                              setCollectorUnknown(false);
                          }}
                        >
                          {t('retry')}
                        </Button>
                      )}
                    </>
                  )}
                </Card>
                <DetailSection title={t('cashDetail.student')}>
                  <Card
                    testID="cash-detail-student"
                    className="mx-space-0 flex-row items-center gap-space-12 px-space-20 py-space-16"
                  >
                    <Avatar
                      size={40}
                      name={order.student.displayName ?? t('cash.noName')}
                    />
                    <Text className="flex-1 text-size-15 font-bvp-medium">
                      {order.student.displayName ?? t('cash.noName')}
                    </Text>
                  </Card>
                </DetailSection>
                <DetailSection
                  title={t('cashDetail.classes', {
                    count: order.details.length,
                  })}
                >
                  <Card className="mx-space-0 px-space-20 py-space-16 gap-space-12">
                    {order.details.map((line, index) => (
                      <View
                        key={line.id}
                        testID={`cash-detail-line-${line.id}`}
                        className={`flex-row items-start gap-space-12 ${index > 0 ? 'border-t border-mdy-divider pt-space-12' : ''}`}
                      >
                        <View className="flex-1 gap-space-3">
                          <Text className="font-bvp-semibold">
                            {line.courseTitle}
                          </Text>
                          <Text className="text-size-13 text-mdy-secondary">
                            {line.className}
                          </Text>
                          {line.quantity > 1 && (
                            <Text
                              testID={`cash-detail-line-${line.id}-qty`}
                              className="text-size-12 text-mdy-tertiary"
                            >
                              {t('cashDetail.lineQty', {
                                quantity: line.quantity,
                                price: formatMoney(line.priceAmount),
                              })}
                            </Text>
                          )}
                        </View>
                        <MoneyText
                          value={line.totalAmount}
                          testID={`cash-detail-line-${line.id}-amount`}
                        />
                      </View>
                    ))}
                  </Card>
                </DetailSection>
                <DetailSection title={t('cashDetail.info')}>
                  <Card className="mx-space-0 px-space-20 py-space-16 gap-space-12">
                    <InfoRow
                      testID="cash-detail-code"
                      label={t('cashDetail.code')}
                      value={order.orderCode}
                    />
                    <InfoRow
                      label={t('cashDetail.method')}
                      value={t('cashDetail.cash')}
                    />
                    <InfoRow
                      testID="cash-detail-created"
                      label={t('cashDetail.createdAt')}
                      value={`${isoTime(order.createdAt)} ${isoDate(order.createdAt)}`}
                    />
                  </Card>
                </DetailSection>
                {query.offline && (
                  <Text
                    testID="cash-detail-stale"
                    className="text-size-12 text-mdy-secondary"
                  >
                    {t('cashDetail.stale')}
                  </Text>
                )}
              </>
            ))}
        </QueryState>
      )}
      {sheet && order && !fatal && (
        <Sheet
          testID="cash-detail-sheet"
          title={t('cashDetail.sheetTitle')}
          onClose={close}
        >
          <Text>{order.orderCode}</Text>
          <MoneyText
            value={order.totalAmount}
            testID="cash-detail-sheet-amount"
            large
          />
          <Text>{order.student.displayName ?? t('cash.noName')}</Text>
          <Text>{order.details.map((d) => d.className).join(', ')}</Text>
          <Field
            inputRef={amountRef}
            id="cash-detail-received"
            label={t('cashDetail.received')}
            value={amount}
            onChange={(v) => {
              const digits = v.replace(/\D/g, '').slice(0, 16);
              setAmount(digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
              setInvalid(false);
            }}
            keyboardType="number-pad"
            multiline={false}
            disabled={busy || unknown}
            error={
              invalid
                ? t('cashDetail.mismatch', {
                    total: formatMoney(order.totalAmount),
                  })
                : undefined
            }
          />
          <Text className="text-size-12 text-mdy-secondary">
            {t('cashDetail.fullOnly')}
          </Text>
          {unknown ? (
            <Alert
              testID="cash-detail-unknown"
              warning
            >
              <Text accessibilityLiveRegion="assertive">
                {t('cashDetail.unknown')}
              </Text>
              {!query.offline && (
                <Button
                  testID={
                    retryAllowed ? 'cash-detail-resend' : 'cash-detail-recheck'
                  }
                  disabled={busy}
                  busy={busy}
                  onPress={() => (retryAllowed ? collect(true) : recheck())}
                >
                  {t(retryAllowed ? 'cashDetail.resend' : 'cashDetail.recheck')}
                </Button>
              )}
            </Alert>
          ) : (
            <Button
              testID="cash-detail-submit"
              busy={busy}
              disabled={!amount || busy || query.offline}
              onPress={() => collect()}
            >
              {t('cashDetail.confirm')}
            </Button>
          )}
          <Button
            testID="cash-detail-sheet-back"
            variant="text"
            disabled={busy || unknown}
            onPress={close}
          >
            {t('cashDetail.back')}
          </Button>
        </Sheet>
      )}
    </Page>
  );
}
