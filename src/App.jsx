import { useState, useCallback, useEffect } from 'react'
import BottomNav from './components/BottomNav'
import HomeScreen from './screens/HomeScreen'
import EmergencyActiveScreen from './screens/EmergencyActiveScreen'
import CameraScreen from './screens/CameraScreen'
import FamilyJoinScreen from './screens/FamilyJoinScreen'
import FamilyDashScreen from './screens/FamilyDashScreen'
import ContactsScreen from './screens/ContactsScreen'
import MapScreen from './screens/MapScreen'
import ProfileScreen from './screens/ProfileScreen'
import { generateCode, createSession } from './utils/session'
import './App.css'

const FULL_SCREEN = new Set(['camera', 'familyJoin', 'familyDash'])

export default function App() {
  const [tab, setTab] = useState('emergency')
  const [screen, setScreen] = useState('home')
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [sessionCode, setSessionCode] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [naloxoneGiven, setNaloxoneGiven] = useState(false)
  const [userName, setUserName] = useState(() => localStorage.getItem('sr_userName') || '')
  const [location, setLocation] = useState(null)
  const [visionResult, setVisionResult] = useState(null)
  const [familyJoinCode, setFamilyJoinCode] = useState('')
  const [familyMemberName, setFamilyMemberName] = useState('')
  const [urlCode, setUrlCode] = useState('')

  useEffect(() => {
    const match = window.location.pathname.match(/^\/join\/([A-Z0-9]{6})$/i)
    if (match) {
      setUrlCode(match[1].toUpperCase())
      setScreen('familyJoin')
      window.history.replaceState(null, '', '/')
    }
  }, [])

  const saveUserName = useCallback((name) => {
    setUserName(name)
    localStorage.setItem('sr_userName', name)
  }, [])

  function startEmergency() {
    const code = generateCode()
    createSession(code, userName)
    setSessionCode(code)
    setEmergencyActive(true)
    setChatHistory([])
    setNaloxoneGiven(false)
    setVisionResult(null)
    setScreen('emergency')
    setTab('emergency')
  }

  function endEmergency() {
    setEmergencyActive(false)
    setSessionCode(null)
    setChatHistory([])
    setNaloxoneGiven(false)
    setVisionResult(null)
    setLocation(null)
    setScreen('home')
  }

  function handleTabChange(newTab) {
    setTab(newTab)
    if (newTab === 'emergency') {
      setScreen(emergencyActive ? 'emergency' : 'home')
    }
  }

  function renderScreen() {
    if (screen === 'camera') {
      return (
        <CameraScreen
          key="camera"
          onBack={() => setScreen('emergency')}
          onResult={(r) => { setVisionResult(r); setScreen('emergency') }}
          location={location}
        />
      )
    }
    if (screen === 'familyJoin') {
      return (
        <FamilyJoinScreen
          key="familyJoin"
          initialCode={urlCode}
          onBack={() => setScreen('home')}
          onJoin={(code, name) => {
            setFamilyJoinCode(code)
            setFamilyMemberName(name)
            setScreen('familyDash')
          }}
        />
      )
    }
    if (screen === 'familyDash') {
      return (
        <FamilyDashScreen
          key="familyDash"
          sessionCode={familyJoinCode}
          memberName={familyMemberName}
          onBack={() => setScreen('home')}
        />
      )
    }

    if (tab === 'contacts') return <ContactsScreen key="contacts" />
    if (tab === 'map') return (
      <MapScreen
        key="map"
        location={location}
        onUpdateLocation={setLocation}
        onGoToEmergency={() => handleTabChange('emergency')}
      />
    )
    if (tab === 'profile') return (
      <ProfileScreen key="profile" userName={userName} onSaveUserName={saveUserName} />
    )

    if (emergencyActive) {
      return (
        <EmergencyActiveScreen
          key="emergency"
          sessionCode={sessionCode}
          onEnd={endEmergency}
          onOpenCamera={() => setScreen('camera')}
          chatHistory={chatHistory}
          onUpdateChatHistory={setChatHistory}
          naloxoneGiven={naloxoneGiven}
          onToggleNaloxone={() => setNaloxoneGiven(n => !n)}
          userName={userName}
          location={location}
          onUpdateLocation={setLocation}
          visionResult={visionResult}
        />
      )
    }

    return (
      <HomeScreen
        key="home"
        onSOS={startEmergency}
        onJoinSession={() => setScreen('familyJoin')}
        userName={userName}
        onSaveUserName={saveUserName}
      />
    )
  }

  const hideNav = FULL_SCREEN.has(screen)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', background: '#0A0A0A' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderScreen()}
      </div>
      {!hideNav && (
        <BottomNav
          activeTab={tab}
          onTabChange={handleTabChange}
          emergencyActive={emergencyActive}
        />
      )}
    </div>
  )
}
