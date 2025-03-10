import { useState } from 'react'

import IconButton from '@mui/joy/IconButton'
import ToggleButtonGroup from '@mui/joy/ToggleButtonGroup'


const FillingQuestMySex = () => {
    const [value, setValue] = useState('male')

    return (
        <>
            <div className="widgets__my-sex">
                <h4 className="headline">Выберите ваш пол</h4>
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
                    <IconButton className="select__item" value="male">Мужчина</IconButton>
                    <IconButton className="select__item" value="female">Женщина</IconButton>
                </ToggleButtonGroup>
            </div>
        </>
    )
}

export default FillingQuestMySex