export { };

interface JSApiRes<T> {
  success: boolean;
  value: T;
}

export enum FLAG {
  NONE,
  BLUE = 3,
}

declare global {
  const resizeDone: boolean;

  type JsApiAny = JSApiRes<any>;
  type JsApiString = JSApiRes<string>;
  type JsApiNumber = JSApiRes<number>;
  type JsApiBoolean = JSApiRes<boolean>;

  export interface AnkiDroidJsInterface {
    ankiAddTagToCard: () => Promise<void>;
    ankiBuryCard: () => Promise<void>;
    ankiGetCardDue: () => Promise<JsApiNumber>;
    ankiGetCardId: () => Promise<JsApiNumber>;
    ankiGetCardInterval: () => Promise<JsApiNumber>;
    ankiGetCardMod: () => Promise<JsApiNumber>;
    ankiGetCardODue: () => Promise<JsApiNumber>;
    ankiGetCardType: () => Promise<JsApiNumber>;
    ankiGetETA: () => Promise<JsApiNumber>;

    /* These should be Promise<JsApiString>, but because of a bug they are
     Promise<String> filled with JSON of JsApiSting. */
    ankiGetNextTime1: () => Promise<string>;
    ankiGetNextTime2: () => Promise<string>;
    ankiGetNextTime3: () => Promise<string>;
    ankiGetNextTime4: () => Promise<string>;

    ankiIsDisplayingAnswer: () => Promise<JsApiBoolean>;
    ankiSearchCard: (query: string) => Promise<any>;
    ankiSetCardDue: (days: number) => Promise<void>;
    ankiShowToast: (msg: string) => Promise<void>;
    init: (str?: string) => Promise<any>;
    mocked: boolean;
    ankiGetCardFactor: () => Promise<JsApiNumber>;
    ankiTtsSpeak: (text: string, queueMode: number) => Promise<void>;
    ankiTtsStop: () => Promise<void>;
    ankiTtsIsSpeaking: () => Promise<JsApiBoolean>;
    ankiTtsSetLanguage: (lang: string) => Promise<void>;
    ankiTtsSetSpeechRate: (speed: number) => Promise<void>;
  }

  class AnkiDroidJS implements AnkiDroidJsInterface {
    constructor(options: { version: string; developer: string });

    ankiToggleFlag(
      flag: "none" | "red" | "orange" | "green" | "blue",
    ): Promise<void>;

    ankiAddTagToCard(): Promise<void>;

    ankiGetCardDue(): Promise<JsApiNumber>;

    ankiGetCardFactor(): Promise<JsApiNumber>;

    ankiGetCardId(): Promise<JsApiNumber>;

    ankiGetCardInterval(): Promise<JsApiNumber>;

    ankiGetCardMod(): Promise<JsApiNumber>;

    ankiGetCardFlag(): Promise<JSApiRes<FLAG>>;

    ankiGetCardODue(): Promise<JsApiNumber>;

    ankiGetCardType(): Promise<JsApiNumber>;

    ankiGetETA(): Promise<JsApiNumber>;

    /* These should be Promise<JsApiString>, but because of a bug they are
     Promise<String> filled with JSON of JsApiSting. */
    ankiGetNextTime1(): Promise<string>;

    ankiGetNextTime2(): Promise<string>;

    ankiGetNextTime3(): Promise<string>;

    ankiGetNextTime4(): Promise<string>;

    ankiIsDisplayingAnswer(): Promise<JsApiBoolean>;

    ankiSearchCard(query: string): Promise<JsApiString>;

    ankiSetCardDue(days: number): Promise<void>;

    ankiTtsIsSpeaking(): Promise<JsApiBoolean>;

    ankiTtsSetLanguage(lang: string): Promise<void>;

    ankiTtsSetSpeechRate(speed: number): Promise<void>;

    ankiTtsSpeak(text: string, queueMode: number): Promise<void>;

    ankiTtsStop(): Promise<void>;

    ankiBuryCard(): Promise<void>;

    init(str: string | undefined): Promise<string>;

    mocked: boolean;

    ankiShowToast(msg: string): Promise<void>;
  }

  // eslint-disable-next-line no-shadow
  interface Window {
    buttonAnswerEase1: () => Promise<void>;
    buttonAnswerEase2: () => Promise<void>;
    buttonAnswerEase3: () => Promise<void>;
    buttonAnswerEase4: () => Promise<void>;
  }
}
