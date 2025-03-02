import { Outlet } from 'react-router-dom'

import NavBar from '../components/Layouts/QuestLayout/NavBar'


const QuestLayout = () => {
    return (
        <>
            <div id="questionnaires-layout">
                <div className="outlet">
                    <Outlet />
                </div>
                <div className="nav-bar">
                    <NavBar />
                </div>
            </div>
        </>
    )
}

export default QuestLayout