export enum ELanguage {
    English = 'en',
    Russian = 'ru',
    Ukrainian = 'ukr',
    Spanish = 'esp',
}

export interface SettingsState {
    isFirstInit: boolean
    lang: ELanguage
}

export interface IState {
    settings: SettingsState
}
