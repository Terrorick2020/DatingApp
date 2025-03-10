import { ChangeEvent, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import { setLang } from '../../store/slices/settingsSlice'
import { appRoutes } from '../../config/routes.config'
import { ELanguage } from '../../types/store.types'

import Button from '@mui/material/Button'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'


const LangContent = () => {
    const regGlobRoute = appRoutes.register.global
    const regFillQuestRoute = appRoutes.register.inner.fillQuest
    const toFillQuest = `${regGlobRoute}/${regFillQuestRoute}`

    const dispatch = useDispatch()

    const handleLanguageChange = (event: ChangeEvent<HTMLInputElement>) => {
        dispatch( setLang( event.target.value ) )
    }

    useEffect(
        () => {
            const langHtml = document.getElementById('lang')
            if ( langHtml ) langHtml.style.animation = 'fadeIn 1s ease-in-out forwards'
        },
        []
    )

    return (
        <>
            <div className="lang__ctx">
                <h3 className="headline">Выберите ваш язык</h3>
                <RadioGroup
                    className="radio-group"
                    aria-labelledby="radio-buttons-lang-group-lable"
                    defaultValue={ ELanguage.Russian }
                    name="radio-buttons-lang-group"
                    onChange={handleLanguageChange}
                >
                    <FormControlLabel value={ ELanguage.English } control={ <Radio /> } label="English" />
                    <FormControlLabel value={ ELanguage.Russian } control={ <Radio /> } label="Русский" />
                    <FormControlLabel value={ ELanguage.Ukrainian } control={ <Radio /> } label="Український" />
                    <FormControlLabel value={ ELanguage.Spanish } control={ <Radio /> } label="Español" />
                </RadioGroup>
            </div>
            <div className="lang__btn">
                <NavLink className="link" to={ toFillQuest }>
                    <Button variant="contained">Далее</Button>
                </NavLink>
            </div>
        </>
    )
}

export default LangContent