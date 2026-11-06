import { useEffect, useState } from 'react'
import Button from '../../components/Button'
import CategoryIconView from '../../components/CategoryIconView'
import Field from '../../components/Field'
import { addCategory, getCategories, updateCategory } from '../../data/repo'
import { CATEGORY_ICONS, type Category, type CategoryIcon } from '../../data/types'
import { useLanguage, type TranslationKey } from '../../i18n'

interface EditorState {
  id: string | null
  name: string
  icon: CategoryIcon
}

const ICON_KEYS: Record<CategoryIcon, TranslationKey> = {
  home: 'categories.iconHome',
  user: 'categories.iconUser',
  utensils: 'categories.iconUtensils',
  wifi: 'categories.iconWifi',
  zap: 'categories.iconZap',
  flame: 'categories.iconFlame',
  bus: 'categories.iconBus',
  book: 'categories.iconBook',
  tag: 'categories.iconTag',
  'shopping-bag': 'categories.iconBag',
  heart: 'categories.iconHeart',
  phone: 'categories.iconPhone',
}

export default function CategoriesScreen() {
  const { lang, t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [error, setError] = useState<TranslationKey | null>(null)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    getCategories()
      .then((rows) => {
        if (!active) {
          return
        }

        setCategories(rows)
        setLoaded(true)
      })
      .catch(() => {
        if (active) {
          setLoaded(true)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function refresh(): Promise<void> {
    setCategories(await getCategories())
  }

  function startAdd(): void {
    setError(null)
    setFailed(false)
    setEditor({ id: null, name: '', icon: 'tag' })
  }

  function startRename(category: Category): void {
    setError(null)
    setFailed(false)
    setEditor({
      id: category.id,
      name: lang === 'bn' ? category.nameBn : category.nameEn,
      icon: category.icon,
    })
  }

  async function save(): Promise<void> {
    if (editor === null || saving) {
      return
    }

    const name = editor.name.trim()

    if (name === '') {
      setError('categories.nameRequired')
      return
    }

    setSaving(true)
    setError(null)
    setFailed(false)

    try {
      if (editor.id === null) {
        await addCategory({ nameEn: name, nameBn: name, icon: editor.icon })
      } else {
        await updateCategory(editor.id, {
          nameEn: name,
          nameBn: name,
          icon: editor.icon,
        })
      }

      await refresh()
      setEditor(null)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  async function toggle(category: Category): Promise<void> {
    if (saving) {
      return
    }

    setSaving(true)
    setFailed(false)

    try {
      await updateCategory(category.id, { archived: !category.archived })
      await refresh()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  function nameFor(category: Category): string {
    return lang === 'bn' ? category.nameBn : category.nameEn
  }

  return (
    <section className="categories-screen">
      <h1 className="screen__title">{t('categories.title')}</h1>
      <p className="screen__text">{t('categories.defaultHint')}</p>

      <div className="categories-actions">
        <Button fullWidth onClick={startAdd}>
          {t('categories.add')}
        </Button>
      </div>

      {editor !== null ? (
        <section className="category-editor">
          <Field
            label={t('categories.nameLabel')}
            value={editor.name}
            autoFocus
            error={error ? t(error) : undefined}
            onChange={(value) => {
              setEditor({ ...editor, name: value })
              setError(null)
            }}
          />

          <h2 className="section-label category-editor__label">
            {t('categories.iconLabel')}
          </h2>
          <div className="icon-grid">
            {CATEGORY_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={
                  editor.icon === icon ? 'icon-choice is-selected' : 'icon-choice'
                }
                aria-label={t(ICON_KEYS[icon])}
                aria-pressed={editor.icon === icon}
                onClick={() => setEditor({ ...editor, icon })}
              >
                <CategoryIconView icon={icon} />
              </button>
            ))}
          </div>

          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setEditor(null)
                setError(null)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {t('categories.save')}
            </Button>
          </div>
        </section>
      ) : null}

      {failed ? (
        <p className="form-error" role="alert">
          {t('error.saveFailed')}
        </p>
      ) : null}

      {loaded ? (
        <ul className="category-list">
          {categories.map((category) => (
            <li className="category-row" key={category.id}>
              <span className="category-row__icon">
                <CategoryIconView icon={category.icon} size={20} />
              </span>
              <span className="category-row__name">{nameFor(category)}</span>
              <button
                type="button"
                className="category-row__action"
                onClick={() => startRename(category)}
              >
                {t('categories.rename')}
              </button>
              <button
                type="button"
                className="category-row__action"
                onClick={() => void toggle(category)}
              >
                {category.archived
                  ? t('categories.show')
                  : t('categories.hide')}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
