import { Outlet } from 'react-router-dom'

const RegisterLayout = () => {
    return (
        <>
            <div className="reg-layout">
                <Outlet />
            </div>
        </>
    )
}

export default RegisterLayout
