import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
} from '@react-native-documents/picker';
import BlobUtil from 'react-native-blob-util';
import {
  importFormatOf,
  maxImportBytes,
  validateImportFile,
  type ImportFatal,
} from './importParser';

export class QuizImportError extends Error {
  constructor(readonly code: ImportFatal) {
    super(code);
  }
}
export async function pickQuestionFile(): Promise<{
  name: string;
  content: string;
} | null> {
  let picked;
  try {
    [picked] = await pick({ allowMultiSelection: false, mode: 'import' });
  } catch (e) {
    if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED)
      return null;
    throw new QuizImportError('importUnreadable');
  }
  const name = picked.name ?? '';
  const invalid = validateImportFile(name, picked.size);
  if (invalid) throw new QuizImportError(invalid);
  let localPath: string | undefined;
  try {
    const [copy] = await keepLocalCopy({
      destination: 'cachesDirectory',
      files: [
        {
          uri: picked.uri,
          fileName: `mindy-quiz-${Date.now()}.${importFormatOf(name)}`,
        },
      ],
    });
    if (copy.status !== 'success')
      throw new QuizImportError('importUnreadable');
    localPath = decodeURI(copy.localUri.replace(/^file:\/\//, ''));
    const content = await BlobUtil.fs.readFile(localPath, 'utf8');
    if (content.length > maxImportBytes)
      throw new QuizImportError('importTooLarge');
    return { name, content };
  } catch (e) {
    throw e instanceof QuizImportError
      ? e
      : new QuizImportError('importUnreadable');
  } finally {
    // The file holds private answer keys, so it never outlives this read.
    if (localPath) BlobUtil.fs.unlink(localPath).catch(() => {});
  }
}
