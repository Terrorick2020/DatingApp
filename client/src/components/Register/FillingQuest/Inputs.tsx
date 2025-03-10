import { useState } from 'react'

import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'


const FillingQuestInputs = () => {
    const [age, setAge] = useState('')

    const handleChange = (event: SelectChangeEvent) => {
        setAge(event.target.value)
    }

    return (
        <>
            <div className="widgets__inputs">
                <h4>Ваше имя</h4>
                <TextField
                    className="name-input"
                    id="name-input"
                    fullWidth
                    placeholder="Имя"
                />
                <h4>Ваш город</h4>
                <FormControl sx={{ m: 1, minWidth: 120 }}>
                    <Select
                        labelId="city-input"
                        id="city-input"
                        value={age}
                        onChange={handleChange}
                    >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem>
                    </Select>
                </FormControl>
            </div>
        </>
    )
}

export default FillingQuestInputs