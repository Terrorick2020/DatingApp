import { createSlice } from '@reduxjs/toolkit'
import { ELanguage } from '../../types/store.types'

const initialState = {
    isFirstInit: true,
    lang: ELanguage.Russian,
}

const settingsSlice = createSlice({
    name: 'questionnaires',
    initialState,
    reducers: {
        setFirstInit: (state, action) => {
            state.isFirstInit = action.payload
        },
        setLang: (state, action) => {
            state.lang = action.payload
        },
    },
})

export const { setFirstInit, setLang } = settingsSlice.actions
export default settingsSlice.reducer