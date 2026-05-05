// import {
//   _addIssue,
//   _getStandardProps,
//   type BaseIssue,
//   type BaseSchema,
//   type ErrorMessage,
//   type OutputDataset,
//   parse,
//   record,
// } from 'valibot'
import {
  String_toNonEmptyStringTrimmed_unsafe,
  type NonEmptyStringTrimmed,
  // type NonEmptyStringTrimmed,
} from './non-empty-string-trimmed'


import * as v from 'valibot'

export const NonEmptyStringTrimmedSchema = v.pipe(v.string(), v.trim(), v.nonEmpty(), v.transform(String_toNonEmptyStringTrimmed_unsafe))

export const RecordWithNESTKeysSchema =
  <TValue, TIssue extends v.BaseIssue<unknown>>(
    vs: v.BaseSchema<TValue, TValue, TIssue>
  ): v.CustomSchema<{ [P in NonEmptyStringTrimmed]: TValue; }, undefined> =>
    v.record(
      v.pipe(v.string(), v.trim(), v.nonEmpty()),
      vs
    ) as any

// export const NonEmptyStringTrimmedSchema = v.custom<NonEmptyStringTrimmed>((input) =>
//   typeof input === 'string' && input.trim().length > 0
// );


// /**
//  * Non-empty string trimmed issue interface.
//  */
// export interface NonEmptyStringTrimmedIssue extends BaseIssue<unknown> {
//   /**
//    * The issue kind.
//    */
//   readonly kind: 'schema'
//   /**
//    * The issue type.
//    */
//   readonly type: 'non_empty_string_trimmed'
//   /**
//    * The expected property.
//    */
//   readonly expected: 'nonEmptyStringTrimmed'
// }

// /**
//  * Non-empty string trimmed schema interface.
//  */
// export interface NonEmptyStringTrimmedSchema<
//   TMessage extends ErrorMessage<NonEmptyStringTrimmedIssue> | undefined,
// > extends BaseSchema<string, NonEmptyStringTrimmed, NonEmptyStringTrimmedIssue> {
//   /**
//    * The schema type.
//    */
//   readonly type: 'non_empty_string_trimmed'
//   /**
//    * The schema reference.
//    */
//   readonly reference: typeof nonEmptyStringTrimmed
//   /**
//    * The expected property.
//    */
//   readonly expects: 'nonEmptyStringTrimmed'
//   /**
//    * The error message.
//    */
//   readonly message: TMessage
// }

// /**
//  * Creates a non-empty string trimmed schema.
//  *
//  * @returns A non-empty string trimmed schema.
//  */
// export function nonEmptyStringTrimmed(): NonEmptyStringTrimmedSchema<undefined>

// /**
//  * Creates a non-empty string trimmed schema.
//  *
//  * @param message The error message.
//  *
//  * @returns A non-empty string trimmed schema.
//  */
// export function nonEmptyStringTrimmed<
//   const TMessage extends ErrorMessage<NonEmptyStringTrimmedIssue> | undefined,
// >(message: TMessage): NonEmptyStringTrimmedSchema<TMessage>

// // @__NO_SIDE_EFFECTS__
// export function nonEmptyStringTrimmed(
//   message?: ErrorMessage<NonEmptyStringTrimmedIssue>,
// ): NonEmptyStringTrimmedSchema<ErrorMessage<NonEmptyStringTrimmedIssue> | undefined> {
//   return {
//     kind: 'schema',
//     type: 'non_empty_string_trimmed',
//     reference: nonEmptyStringTrimmed,
//     expects: 'nonEmptyStringTrimmed',
//     async: false,
//     message,
//     get '~standard'() {
//       return _getStandardProps(this)
//     },
//     '~run'(dataset, config) {
//       if (typeof dataset.value === 'string') {
//         const trimmed = dataset.value.trim()
//         if (trimmed.length > 0) {
//           dataset.value = String_toNonEmptyStringTrimmed_unsafe(trimmed)
//           // @ts-expect-error INTERNAL
//           dataset.typed = true
//         } else {
//           _addIssue(this, 'type', dataset, config)
//         }
//       } else {
//         _addIssue(this, 'type', dataset, config)
//       }
//       return dataset as any
//     },
//   }
// }


{
  // const _typeTestNotWork: Record<NonEmptyStringTrimmed, NonEmptyStringTrimmed> = v.parse(
  //   v.record(NonEmptyStringTrimmedSchema, NonEmptyStringTrimmedSchema),
  //   { '  hello  ': '  world  ' },
  // )

  // use this though its unsafe
  const _typeTestWillWork: Record<NonEmptyStringTrimmed, NonEmptyStringTrimmed> = v.parse(
    v.record(v.pipe(v.string(), v.trim(), v.nonEmpty()), NonEmptyStringTrimmedSchema),
    { '  hello  ': '  world  ' },
  )

  const _typeTestWillWork2: Record<NonEmptyStringTrimmed, NonEmptyStringTrimmed> = v.parse(
    RecordWithNESTKeysSchema(NonEmptyStringTrimmedSchema),
    { '  hello  ': '  world  ' },
  )

}