import { NavLink } from 'react-router-dom'

// import { appRoutes } from '../../../config/routes.config'

import Button from '@mui/material/Button'


const EveningPlansContent = () => {
    // const regGlobRoute = appRoutes.register.global
    // const regFillQuestRoute = appRoutes.register.inner.geo
    // const to = `${regGlobRoute}/${regFillQuestRoute}`

    return (
        <>
            <div className="geo__ctx"></div>
            <div className="geo__btn">
                <NavLink className="link" to={ '' }>
                    <Button variant="contained">Применить</Button>
                </NavLink>
            </div>
        </>
    )
}

export default EveningPlansContent
