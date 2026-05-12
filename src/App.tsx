import { lazy, Suspense } from 'react'

///Lazy load pages only downloads a page  code when the user visits it 

const home = lazy(() => import('./pages/Home'))


function App() {


  return (
    <>

    </>
  )
}

export default App
