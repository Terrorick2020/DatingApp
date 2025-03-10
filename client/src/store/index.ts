import { configureStore, combineReducers } from '@reduxjs/toolkit'

import chatsReducer from './slices/chatsSlice'
import likesReducer from './slices/likesSlice'
import profileReducer from './slices/profileSlice'
import questionnairesReducer from './slices/questionnairesSlice'
import settingsReducer from './slices/settingsSlice'

const rootReducer = combineReducers({
    chats: chatsReducer,
    likes: likesReducer,
    profile: profileReducer,
    questionnaires: questionnairesReducer,
    settings: settingsReducer,
})

const store = configureStore({
    reducer: rootReducer,
})

export type TDispatch = typeof store.dispatch
export default store
