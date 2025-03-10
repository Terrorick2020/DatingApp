import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import axios from 'axios'


const initialState = {}

export const initProfileAsync = createAsyncThunk(
    'profile/init-profile',
    async ( data: string, _thunkAPI ) => {
        const url = new URL(data)
        const params = new URLSearchParams(url.hash.substring(1))
        const tgData = params.get('tgWebAppData')

        if (!tgData) return null

        const parsedData = Object.fromEntries(new URLSearchParams(tgData))

        if (parsedData.user) {
            parsedData.user = JSON.parse(parsedData.user)
        }
        
        const response = await axios.post(
            'http://localhost:3000/auth',
            {
                data: parsedData,
            }
        )

        return response.status === 201
    }
)

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(initProfileAsync.pending, state => {
            console.log(state)
        })
        builder.addCase(initProfileAsync.fulfilled, ( state, action ) => {
            console.log( state, action )
        })
        builder.addCase(initProfileAsync.rejected, state => {
            console.log(state)
        })
    }
})

// export const {} = profileSlice.actions
export default profileSlice.reducer