import type { NextPage } from 'next'
import Welcome from '../components/Welcome'

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Welcome />
    </div>
  )
}

export default Home