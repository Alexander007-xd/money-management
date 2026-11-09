import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { TranslationKey } from '../i18n/bn'

/** `useLanguage().t` has exactly this shape (an optional params argument is fine). */
export type TranslateKey = (key: TranslationKey) => string

const SHARE_DIALOG_TITLE_KEY: TranslationKey = 'backup.shareTitle'
const SHARE_TITLE = 'Taka Khata'

const identity: TranslateKey = (key) => key

/**
 * Save a JSON string as a file.
 *
 * - Browser / PWA: download it with a temporary `<a download>` element.
 * - Android (Capacitor): a WebView cannot download, so write the JSON to the
 *   cache folder and open the system share sheet instead.
 *
 * `translate` only affects the native share dialog title; the browser path
 * ignores it.
 */
export async function downloadJson(
  json: string,
  fileName: string,
  translate: TranslateKey = identity,
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    })

    await Share.share({
      title: SHARE_TITLE,
      files: [written.uri],
      dialogTitle: translate(SHARE_DIALOG_TITLE_KEY),
    })
    return
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
