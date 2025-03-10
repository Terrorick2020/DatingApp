import { useState } from 'react'

import IconButton from '@mui/joy/IconButton'
import ToggleButtonGroup from '@mui/joy/ToggleButtonGroup'


const FillingQuestSelectionSex = () => {
    const [value, setValue] = useState('male')

    return (
        <>
            <div className="widgets__selection-sex">
                <h4 className="headline">Выберите, кого вы ищите</h4>
                <ToggleButtonGroup
                    className="select"
                    spacing={ 2 }
                    value={ value }
                    onChange={(_event, newValue) => {
                        if ( newValue !== null ) {
                            setValue(newValue)
                        }
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

export default FillingQuestSelectionSex