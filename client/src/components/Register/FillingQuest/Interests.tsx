import { useState } from 'react'

import IconButton from '@mui/joy/IconButton'
import ToggleButtonGroup from '@mui/joy/ToggleButtonGroup'


const FillingQuestInterests = () => {
    const [value, setValue] = useState([])

    return (
        <>
            <div className="widgets__interests">
                <h4 className="headline">Вы хотите найти</h4>
                <ToggleButtonGroup
                    className="select"
                    spacing={ 2 }
                    value={ value }
                    onChange={(_event, newValue) => {
                        setValue(newValue)
                    }}
                >
                    <IconButton className="select__item" value="male">Мужчину</IconButton>
                    <IconButton className="select__item" value="female">Женщину</IconButton>
                    <IconButton className="select__item" value="all">Всех</IconButton>
                </ToggleButtonGroup>
            </div>
        </>
    )
}

export default FillingQuestInterests