import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadJson } from './nativeFile'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}))

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { writeFile: vi.fn() },
}))

vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn() },
}))

const isNative = vi.mocked(Capacitor.isNativePlatform)
const writeFile = vi.mocked(Filesystem.writeFile)
const share = vi.mocked(Share.share)

describe('downloadJson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNative.mockReturnValue(false)
  })

  it('downloads a JSON blob in the browser', async () => {
    isNative.mockReturnValue(false)
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    await downloadJson('{"app":"taka-khata"}', 'backup.json')

    expect(writeFile).not.toHaveBeenCalled()
    expect(share).not.toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined
    expect(anchor?.download).toBe('backup.json')
  })

  it('writes cache file and opens the native share sheet on Android', async () => {
    isNative.mockReturnValue(true)
    writeFile.mockResolvedValue({ uri: 'file:///cache/backup.json' })
    share.mockResolvedValue({ activityType: 'test' })

    await downloadJson('{"app":"taka-khata"}', 'backup.json')

    expect(writeFile).toHaveBeenCalledWith({
      path: 'backup.json',
      data: '{"app":"taka-khata"}',
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    expect(share).toHaveBeenCalledWith({
      title: 'Taka Khata',
      files: ['file:///cache/backup.json'],
      dialogTitle: 'backup.shareTitle',
    })
  })
})
