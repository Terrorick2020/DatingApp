import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../config/routes.config'

import Button from '@mui/material/Button'

import SvgHeartInHand from '../../assets/icon/heart-in-hand.svg'
import SvgLogo from '../../assets/icon/logo.svg'


const PreviewContent = () => {
    const regGlobRoute = appRoutes.register.global
    const regLangRoute = appRoutes.register.inner.lang
    const toLang = `${regGlobRoute}/${regLangRoute}`

    useEffect(
        () => {
            const langHtml = document.getElementById('preview')
            if ( langHtml ) langHtml.style.animation = 'fadeIn 1s ease-in-out forwards'
        },
        [] 
    )

    return (
        <>
            <div className="preview__logo">
                <img className="heart-in-hand" src={ SvgHeartInHand } alt="heart-in-hand" />
            </div>
            <div className="preview__ctx">
                <div className="content">
                    <img className="logo" src={ SvgLogo } alt="logo" />
                    <h3 className="headline">Привет!</h3>
                    <p className="description">Мы верим, что настоящие связи устанавливаются лицом к лицу. Вот почему наша главная цель — помочь вам встретиться с людьми лично, создавая значимые моменты и впечатления.</p>
                </div>
                <NavLink className="link" to={ toLang }>
                    <Button variant="contained">Создать профиль</Button>
                </NavLink>
            </div>
        </>
    )
}

export default PreviewContent