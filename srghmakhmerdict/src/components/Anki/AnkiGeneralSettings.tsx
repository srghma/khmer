import { memo } from 'react'
import { Card, CardBody, CardHeader, Switch } from '@heroui/react'
import { useI18nContext } from '../../i18n/i18n-react-custom'

export const AnkiGeneralSettings = memo(() => {
  const { LL } = useI18nContext()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-2xl mx-auto h-full overflow-y-auto scrollbar-hide">
      <Card className="border border-divider" shadow="sm">
        <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">{LL.ANKI.SETTINGS.TITLE()}</h2>
        </CardHeader>
        <CardBody className="gap-6 px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-medium text-foreground text-base">
                Nothing is selected
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
})

AnkiGeneralSettings.displayName = 'AnkiGeneralSettings'
