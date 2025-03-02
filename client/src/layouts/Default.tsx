import { Outlet } from 'react-router-dom'

import DefaultNav from '../components/Layouts/DefaultNav'

const DefaultLayout = () => {
    return (
        <>  
            <div className="default">
                <div className="block">
                    <div id="default-layout">
                        <div className="head-nav">
                            <DefaultNav />
                        </div>
                        <Outlet />
                    </div>
                </div>
            </div>
        </>
    )
}

export default DefaultLayout