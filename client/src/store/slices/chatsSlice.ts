import { createSlice } from '@reduxjs/toolkit'

const initialState = {}

const chatsSlice = createSlice({
    name: 'chats',
    initialState,
    reducers: {},
})

// export const {} = chatsSlice.actions
export default chatsSlice.reducer