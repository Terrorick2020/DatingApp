import { Outlet } from 'react-router-dom'

import HeadNav from '../components/Layouts/HeadNav'
import NavBar from '../components/Layouts/QuestLayout/NavBar'


const QuestLayout = () => {
    return (
        <>
            <div className="quest-layout">
                <HeadNav />
                <div className="quest-outlet">
                    <Outlet />
                </div>
                <NavBar />
            </div>
        </>
    )
}

export default QuestLayout