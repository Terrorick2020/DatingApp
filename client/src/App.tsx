import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { appRoutes } from './config/routes.config'

import DefautlLayout from './layouts/Default'
import QuestLayout from './layouts/Questionnaires'
import RegisterLayout from './layouts/Register'

import RegLangPage from './pages/Register/Lang'
import RegPreviewPage from './pages/Register/Preview'
import RegFillingQuestPage from './pages/Register/FillingQuest'
import RegGeoPage from './pages/Register/Geo'
import RegEveningPlansPage from './pages/Register/EveningPlans'
import QuestSliderPage from './pages/Questionnaires/Slider'
import QuestDetailsPage from './pages/Questionnaires/Details'

import './assets/scss/index.scss'


const App = () => {
  const [ preloading, setPreloading ] = useState( true )

  const preloader = document.getElementById( 'preloader' )

  if( preloader ) {
    setTimeout(
      () => {
        preloader.style.display = "none"
        setPreloading( false )
      },
      3000
    )
  }

  const regRoutes = appRoutes.register
  const questRoutes = appRoutes.questionnaires
  
  return (
    !preloading && (
      <>
        <Routes>
          <Route element={ <DefautlLayout /> }>
            <Route path={ regRoutes.global } element={ <RegisterLayout /> } >
              <Route path={ regRoutes.inner.preview } element={ <RegPreviewPage /> } />
              <Route path={ regRoutes.inner.lang } element={ <RegLangPage /> } />
              <Route path={ regRoutes.inner.fillQuest } element={ <RegFillingQuestPage /> } />
              <Route path={ regRoutes.inner.geo } element={ <RegGeoPage /> } />
              <Route path={ regRoutes.inner.eveningPlans } element={ <RegEveningPlansPage /> } />
            </Route>
            <Route path={ questRoutes.global } element={ <QuestLayout /> } >
              <Route path={ questRoutes.inner.slider } element={<QuestSliderPage />} />
              <Route path={ questRoutes.inner.details } element={<QuestDetailsPage />} />
            </Route>
          </Route>
        </Routes>
      </>
    )
  )
}

export default App
