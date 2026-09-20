const BACKEND_FALLBACK_ORIGIN = "http://127.0.0.1:4175"

let backendOnline = false
let backendProfile = null
let backendLeaderboard = []
let backendChallenge = null

async function apiRequest(path, options = {}){
  const origins = []

  if(location.protocol.startsWith("http")){
    origins.push(location.origin)
  }

  if(!origins.includes(BACKEND_FALLBACK_ORIGIN)){
    origins.push(BACKEND_FALLBACK_ORIGIN)
  }

  let lastError = null

  for(const origin of origins){
    try {
      const response = await fetch(origin + path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      })

      if(!response.ok){
        throw new Error("Backend returned " + response.status)
      }

      backendOnline = true
      return await response.json()
    } catch(error){
      lastError = error
    }
  }

  backendOnline = false
  throw lastError
}

async function initBackend(){
  try {
    const [profile, challenge, leaderboardData] = await Promise.all([
      apiRequest("/api/profile"),
      apiRequest("/api/challenge"),
      apiRequest("/api/leaderboard")
    ])

    backendProfile = profile
    backendChallenge = challenge
    backendLeaderboard = leaderboardData.leaderboard || []

    renderBackendPanel()
    addFeed("Backend online: daily challenge and leaderboard loaded.")
  } catch {
    renderBackendOffline()
  }
}

async function loadTableEvent(){
  if(!backendOnline) return

  try {
    const event = await apiRequest("/api/event")
    addFeed("Pit boss: " + event.message)
  } catch {
    backendOnline = false
    renderBackendOffline()
  }
}

async function syncRoundToBackend(result){
  if(!backendOnline) return

  try {
    const data = await apiRequest("/api/round", {
      method: "POST",
      body: JSON.stringify({
        bankroll,
        stats,
        tableLevel: tableLevel.name,
        result
      })
    })

    backendProfile = data.profile
    backendLeaderboard = data.leaderboard || []
    renderBackendPanel()

    ;(data.newAchievements || []).forEach(name => {
      addFeed("Achievement unlocked: " + name + ".")
    })
  } catch {
    backendOnline = false
    renderBackendOffline()
  }
}

function renderBackendPanel(){
  const challengeText = document.getElementById("challenge-text")
  const leaderboardList = document.getElementById("leaderboard-list")
  const achievementList = document.getElementById("achievement-list")

  if(!challengeText || !leaderboardList || !achievementList) return

  challengeText.innerText = backendChallenge
    ? backendChallenge.title + ": reach $" + backendChallenge.target + ". Bonus: " + backendChallenge.bonus + "."
    : "Daily challenge unavailable."

  leaderboardList.innerHTML = ""

  backendLeaderboard.forEach(row => {
    const item = document.createElement("li")
    item.innerText = row.name + " - $" + row.bankroll
    leaderboardList.appendChild(item)
  })

  achievementList.innerText = backendProfile?.achievements?.length
    ? backendProfile.achievements.join(" / ")
    : "No achievements yet."
}

function renderBackendOffline(){
  const challengeText = document.getElementById("challenge-text")
  const leaderboardList = document.getElementById("leaderboard-list")
  const achievementList = document.getElementById("achievement-list")

  if(challengeText){
    challengeText.innerText = "Start the backend server for daily challenges."
  }

  if(leaderboardList){
    leaderboardList.innerHTML = "<li>Backend offline</li>"
  }

  if(achievementList){
    achievementList.innerText = "Achievements save when the backend is running."
  }
}
