import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react'
import { Button } from '@heroui/button'
import { Checkbox } from '@heroui/react'
import { IoFilterOutline } from 'react-icons/io5'

export interface ListFilters {
  en: boolean
  km: boolean
  ru: boolean
  analyzer: boolean
}

interface ListFilterModalProps {
  filters: ListFilters
  onChange: (newFilters: ListFilters) => void
}

export const ListFilterModal: React.FC<ListFilterModalProps> = ({ filters, onChange }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const handleToggle = (key: keyof ListFilters) => {
    onChange({
      ...filters,
      [key]: !filters[key],
    })
  }

  return (
    <>
      <Button
        isIconOnly
        className="min-w-8 w-8 h-8 bg-default-100 hover:bg-default-200"
        size="sm"
        variant="flat"
        onPress={onOpen}
      >
        <IoFilterOutline size={18} />
      </Button>
      <Modal isOpen={isOpen} placement="center" size="xs" onOpenChange={onOpenChange}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Filter List</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Checkbox isSelected={filters.en} onValueChange={() => handleToggle('en')}>
                    English (en)
                  </Checkbox>
                  <Checkbox isSelected={filters.ru} onValueChange={() => handleToggle('ru')}>
                    Russian (ru)
                  </Checkbox>
                  <Checkbox isSelected={filters.km} onValueChange={() => handleToggle('km')}>
                    Khmer (km)
                  </Checkbox>
                  <Checkbox isSelected={filters.analyzer} onValueChange={() => handleToggle('analyzer')}>
                    Sentences (Analyzer)
                  </Checkbox>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button className="w-full" color="primary" onPress={onClose}>
                  Done
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
