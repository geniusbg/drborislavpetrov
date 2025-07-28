/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-var */

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

declare global {
  var __DEV__: boolean
  var __PROD__: boolean
}

export {} 