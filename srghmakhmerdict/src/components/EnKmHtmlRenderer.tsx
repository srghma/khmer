import { useRef, useMemo } from 'react'

const EN_KM_STYLES = `
  .en-km-scope {
    font-size: 1rem;
    line-height: 1.6;
    color: hsl(var(--heroui-foreground) / 0.9);
  }

  /* Image styling to ensure they fit the card */
  .en-km-scope img.ek-img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid hsl(var(--heroui-divider));
  }

  .en-km-scope a {
    color: hsl(var(--heroui-primary));
    text-decoration: none;
    font-weight: 500;
  }
  .en-km-scope a:hover {
    text-decoration: underline;
  }
`

export const EnKmHtmlRenderer = ({ html }: { html: string }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. FIX IMAGE PATHS
  // We look for src="en_Dict_..." and replace it with src="/en_Dict_..."
  // This forces the browser to look at the ROOT of the public folder, not relative to the current route.
  const fixedHtml = useMemo(() => {
    if (!html) return undefined

    const fixedHtml = html.replace(/src=["'](en_Dict_en_km_com_assets_images\/[^"']+)["']/g, 'src="/$1"')

    return { __html: fixedHtml }
  }, [html])

  if (!fixedHtml) return

  return (
    <>
      <style>{EN_KM_STYLES}</style>
      <div dangerouslySetInnerHTML={fixedHtml} ref={containerRef} className="en-km-scope" />
    </>
  )
}
