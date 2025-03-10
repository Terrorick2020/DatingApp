import { NavLink } from 'react-router-dom'

import { appRoutes } from '../../config/routes.config'

import Button from '@mui/material/Button'


const GeoContent = () => {
    const regGlobRoute = appRoutes.register.global
    const regEveningPlansRoute = appRoutes.register.inner.eveningPlans
    const toEveningPlans = `${regGlobRoute}/${regEveningPlansRoute}`

    return (
        <>
            <div className="geo__ctx"></div>
            <div className="geo__btn">
                <NavLink className="link" to={ toEveningPlans }>
                    <Button variant="contained">Применить</Button>
                </NavLink>
            </div>
        </>
    )
}

export default GeoContent