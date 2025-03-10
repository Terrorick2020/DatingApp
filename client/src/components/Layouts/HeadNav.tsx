import { useLocation, NavLink } from 'react-router-dom'
import { appRoutes } from '../../config/routes.config'

import Button from '@mui/material/Button'

import SvgArrowDown from '../../assets/icon/arrow-down.svg?react'
import SvgArrowLeft from '../../assets/icon/arrow-left.svg?react'
import SvgClose from '../../assets/icon/close.svg?react'
import SvgOther from '../../assets/icon/other.svg?react'


const HeadNav = () => {
    const location = useLocation()

    const questRoutes = appRoutes.questionnaires
    const isDetails = `${questRoutes.global}/${questRoutes.inner.details}` === location.pathname

    return  (
        <>
            <nav className="head-nav__components">
                {
                    isDetails
                        ?
                        <NavLink to={questRoutes.global + questRoutes.inner.slider} >
                            <Button className="btn text-fon rounded" variant="contained" startIcon={<SvgArrowLeft />}>
                                Back
                            </Button>
                        </NavLink>
                        :
                        <Button className="btn text-fon rounded" variant="contained" startIcon={<SvgClose />}>
                            Close
                        </Button>
                }
                <Button className="btn text-fon rounded" variant="contained" startIcon={<SvgArrowDown />} endIcon={<SvgOther />}></Button>
            </nav>
        </>
    )
}

export default HeadNav