import React, { useMemo } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/react'

interface DefinitionPopupProps {
  definitionHtml: string
}

export const DefinitionPopup = React.memo(({ definitionHtml }: DefinitionPopupProps) => {
  const dangerouslySetInnerHTML = useMemo(() => ({ __html: definitionHtml }), [definitionHtml])

  return (
    <div className="relative w-full flex justify-center mt-1">
      <Popover backdrop="transparent" offset={10} placement="bottom" showArrow={true}>
        <PopoverTrigger>
          <button
            className="w-full min-w-[60px] h-[2.6em] px-1 rounded-sm bg-default-200/60 hover:bg-default-300/60 cursor-pointer select-none overflow-hidden outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2"
            title="Click to expand definition"
            type="button"
          >
            {/* Collapsed Content: Plain HTML, Clamped to 2 lines */}
            <div
              dangerouslySetInnerHTML={dangerouslySetInnerHTML}
              className="text-[10px] leading-[1.2] text-center text-foreground/80 line-clamp-2 pointer-events-none [&_i]:not-italic [&_i]:text-primary"
            />
          </button>
        </PopoverTrigger>

        <PopoverContent className="p-0 max-w-[300px] w-max">
          <div
            dangerouslySetInnerHTML={dangerouslySetInnerHTML}
            className="max-h-[250px] overflow-y-auto p-3 text-xs text-foreground prose prose-sm max-w-none dark:prose-invert [&_i]:text-primary [&_i]:not-italic [&_i]:font-medium select-text"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
})

DefinitionPopup.displayName = 'DefinitionPopup'
