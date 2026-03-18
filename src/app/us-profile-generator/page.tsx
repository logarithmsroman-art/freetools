'use client'

import { useState } from 'react'
import BackButton from '@/components/BackButton'

// Core Data Pools
const STATES_WITH_CITIES: Record<string, string[]> = {
  'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'],
  'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
  'Illinois': ['Chicago', 'Aurora', 'Joliet', 'Naperville', 'Rockford'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Bellevue', 'Olympia'],
  'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
  'Arizona': ['Phoenix', 'Tucson', 'Scottsdale', 'Mesa', 'Chandler'],
  'Nevada': ['Las Vegas', 'Reno', 'Henderson', 'North Las Vegas', 'Sparks'],
  'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
}

const STREET_NAMES = ['Maple Ave', 'Oak Street', 'Cedar Lane', 'River Road', 'Park Blvd', 'Washington St', 'Lincoln Ave', 'Highland Dr', 'Sunset Blvd', 'Forest Way', 'Lake Shore Dr', 'Main Street', 'Elm Street', 'Cherry Hill Rd']

const JOBS = ['Software Engineer', 'Registered Nurse', 'High School Teacher', 'Graphic Designer', 'Accountant', 'Marketing Manager', 'Electrician', 'Sales Representative', 'Financial Analyst', 'Customer Service', 'Pharmacist', 'Police Officer', 'Chef']
const BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
const VEHICLES = ['2019 Toyota Camry', '2021 Honda Civic', '2018 Ford F-150', '2022 Tesla Model 3', '2017 Chevrolet Silverado', '2020 Subaru Outback', '2016 Nissan Altima', '2023 Hyundai Tucson', 'None (Commuter)']
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed', 'In a relationship']

// Ethnic specific data
type EthnicityObj = {
  m: string[];
  f: string[];
  last: string[];
  skin: string[];
  hair: string[];
  eyes: string[];
}
const ETHNICITIES: Record<string, EthnicityObj> = {
  white: {
    m: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Paul'],
    f: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Dorothy', 'Emily'],
    last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin', 'Jackson', 'White'],
    skin: ['Fair', 'Pale', 'Light', 'Peach', 'Olive'],
    hair: ['Blonde', 'Dirty Blonde', 'Light Brown', 'Brown', 'Dark Brown', 'Red', 'Auburn', 'Gray'],
    eyes: ['Blue', 'Green', 'Hazel', 'Brown', 'Gray', 'Amber']
  },
  black: {
    m: ['Jamal', 'Andre', 'Marcus', 'Tyrone', 'Terrell', 'Malik', 'Darnell', 'Trevon', 'Jeremiah', 'Elijah', 'DeAndre', 'Deshawn', 'Xavier', 'Isaiah', 'Jayden'],
    f: ['Aaliyah', 'Ebony', 'Jasmine', 'Precious', 'Tierra', 'Raven', 'Diamond', 'Destiny', 'Imani', 'Latoya', 'Tasha', 'Kiara', 'Nia', 'Chloe', 'Zoe'],
    last: ['Washington', 'Jefferson', 'Jackson', 'Robinson', 'Harris', 'Thomas', 'Carter', 'Green', 'Lewis', 'Banks', 'Booker', 'Holmes', 'Rivers', 'Dixon', 'Henderson'],
    skin: ['Dark Brown', 'Medium Brown', 'Ebony', 'Caramel', 'Light Brown', 'Mahogany'],
    hair: ['Black - Coily', 'Black - Curly', 'Dark Brown - Coily', 'Dark Brown - Curly', 'Black - Dreads'],
    eyes: ['Dark Brown', 'Brown', 'Amber']
  },
  hispanic: {
    m: ['Jose', 'Luis', 'Carlos', 'Juan', 'Jorge', 'Pedro', 'Miguel', 'Jesus', 'Alejandro', 'Diego', 'Mateo', 'Santiago', 'Leo', 'Gabriel', 'Daniel'],
    f: ['Maria', 'Rosa', 'Carmen', 'Ana', 'Silvia', 'Luisa', 'Elena', 'Sofía', 'Isabella', 'Camila', 'Valeria', 'Milagros', 'Victoria', 'Luz', 'Martina'],
    last: ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz'],
    skin: ['Olive', 'Medium Beige', 'Tan', 'Light Brown', 'Medium Brown', 'Caramel'],
    hair: ['Black - Straight', 'Black - Wavy', 'Dark Brown - Wavy', 'Medium Brown - Curly', 'Black - Curly'],
    eyes: ['Dark Brown', 'Brown', 'Hazel', 'Amber', 'Green']
  },
  asian: {
    m: ['Wei', 'Li', 'Hao', 'Cheng', 'Jian', 'Min', 'Kevin', 'David', 'Michael', 'Brian', 'Eric', 'Jason', 'John', 'Ryan', 'Alex'],
    f: ['Mei', 'Jing', 'Yan', 'Hua', 'Xiu', 'Chun', 'Jennifer', 'Michelle', 'Jessica', 'Emily', 'Sarah', 'Stephanie', 'Rachel', 'Grace', 'Anna'],
    last: ['Wang', 'Li', 'Zhang', 'Chen', 'Liu', 'Nguyen', 'Kim', 'Patel', 'Tran', 'Sharma', 'Lee', 'Park', 'Chang', 'Wong', 'Singh'],
    skin: ['Fair', 'Light', 'Warm Peach', 'Olive', 'Golden', 'Tan'],
    hair: ['Black - Straight', 'Dark Brown - Straight', 'Black - Wavy', 'Dark Brown - Wavy'],
    eyes: ['Dark Brown', 'Brown', 'Black']
  }
}

// Universal pools
const MIDDLE_NAMES = ['Lee', 'Ray', 'Ann', 'Marie', 'Grace', 'Jay', 'Lynn', 'Mae', 'Jean', 'Rae', 'Kay', 'Rose', 'Faye', 'Dean', 'Blake', 'Lane', 'Jade', 'Drew', 'Quinn']
const HEIGHTS_M = ['5\'7"', '5\'8"', '5\'9"', '5\'10"', '5\'11"', '6\'0"', '6\'1"', '6\'2"']
const HEIGHTS_F = ['5\'0"', '5\'1"', '5\'2"', '5\'3"', '5\'4"', '5\'5"', '5\'6"', '5\'7"']
const WEIGHTS_M = [145, 155, 165, 175, 185, 195, 205, 215, 225, 235]
const WEIGHTS_F = [110, 120, 130, 140, 150, 160, 170, 180, 125, 135]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function getZodiac(month: number, day: number): string {
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius ♒"
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces ♓"
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries ♈"
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus ♉"
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini ♊"
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer ♋"
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo ♌"
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo ♍"
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra ♎"
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio ♏"
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius ♐"
  return "Capricorn ♑"
}

export default function ProfileGenerator() {
  const [targetGender, setTargetGender] = useState<string>('any')
  const [targetRace, setTargetRace] = useState<string>('any')
  const [minAge, setMinAge] = useState<number>(18)
  const [maxAge, setMaxAge] = useState<number>(65)
  const [profile, setProfile] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const generate = () => {
    const gender = targetGender === 'any' ? (Math.random() < 0.5 ? 'm' : 'f') : targetGender as 'm' | 'f'
    const raceKey = targetRace === 'any' ? pick(Object.keys(ETHNICITIES)) : targetRace
    const raceData = ETHNICITIES[raceKey]
    
    const age = Math.floor(Math.random() * (maxAge - minAge + 1) + minAge)
    
    // Names
    const firstName = pick(raceData[gender])
    const middleName = pick(MIDDLE_NAMES)
    const lastName = pick(raceData.last)
    
    // Demographics
    const stateKey = pick(Object.keys(STATES_WITH_CITIES))
    const stateInitial = stateKey.slice(0, 2).toUpperCase()
    const city = pick(STATES_WITH_CITIES[stateKey])
    const zip = Math.floor(Math.random() * 90000) + 10000
    const streetNum = Math.floor(Math.random() * 9000) + 100
    const street = pick(STREET_NAMES)
    
    // Date & Astrology
    const dob_year = new Date().getFullYear() - age
    const dob_month = Math.floor(Math.random() * 12) + 1
    const dob_day = Math.floor(Math.random() * 28) + 1
    const dob = `${String(dob_month).padStart(2,'0')}/${String(dob_day).padStart(2,'0')}/${dob_year}`
    const zodiac = getZodiac(dob_month, dob_day)

    // ID
    const dlNumber = `${stateInitial}-${Math.floor(Math.random() * 9000000) + 1000000}-${pick(['A', 'B', 'C', 'X', 'Z'])}`

    // Build format
    setProfile({
      name: `${firstName} ${middleName} ${lastName}`,
      gender: gender === 'm' ? 'Male' : 'Female',
      ethnicity: raceKey.charAt(0).toUpperCase() + raceKey.slice(1),
      age,
      dob,
      zodiac,
      state: stateKey,
      city,
      zip: zip.toString(),
      street: `${streetNum} ${street}`,
      height: gender === 'm' ? pick(HEIGHTS_M) : pick(HEIGHTS_F),
      weight: `${pick(gender === 'm' ? WEIGHTS_M : WEIGHTS_F)} lbs`,
      skinTone: pick(raceData.skin),
      hairColor: pick(raceData.hair),
      eyeColor: pick(raceData.eyes),
      bloodType: pick(BLOOD_TYPES),
      maritalStatus: pick(MARITAL),
      occupation: pick(JOBS),
      vehicle: pick(VEHICLES),
      driversLicense: dlNumber
    })
    setCopied(false)
  }

  const copyInfo = () => {
    if (!profile) return
    const text = Object.entries(profile).map(([k, v]) => {
      // Add spaces before capitals for camelCase keys
      let cleanKey = k.replace(/([A-Z])/g, ' $1')
      cleanKey = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1)
      return `${cleanKey}: ${v}`
    }).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "1100px" }}>
      <BackButton />

      <header style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-1px", fontWeight: 800 }}>Advanced US Identity Generator</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Generate highly realistic, demographically accurate civilian profiles.</p>
      </header>

      <div className="responsive-grid-sidebar" style={{ gap: "2.5rem", alignItems: "flex-start" }}>
        {/* Controls */}
        <div className="card" style={{ padding: "1.75rem", backgroundColor: "var(--bg-secondary)" }}>
          <h3 style={{ marginBottom: "1.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>Generation Settings</h3>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Race / Ethnicity</label>
            <select 
              value={targetRace} 
              onChange={(e) => setTargetRace(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.95rem", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
            >
              <option value="any">Any (Randomized)</option>
              <option value="white">White / Caucasian</option>
              <option value="black">Black / African American</option>
              <option value="hispanic">Hispanic / Latino</option>
              <option value="asian">Asian American</option>
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Gender</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(['any', 'm', 'f'] as const).map(g => (
                <button key={g} onClick={() => setTargetGender(g)} style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: targetGender === g ? "var(--accent)" : "var(--bg-primary)", color: targetGender === g ? "#fff" : "var(--text-primary)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                  {g === 'm' ? 'Male' : g === 'f' ? 'Female' : 'Any'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Age Range: <strong>{minAge} – {maxAge}</strong></label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", width: "28px", color: "var(--text-secondary)" }}>Min</span>
                <input type="range" min="1" max="99" value={minAge} onChange={e => setMinAge(Math.min(parseInt(e.target.value), maxAge - 1))} style={{ flex: 1, accentColor: "var(--accent)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", width: "28px", color: "var(--text-secondary)" }}>Max</span>
                <input type="range" min="2" max="100" value={maxAge} onChange={e => setMaxAge(Math.max(parseInt(e.target.value), minAge + 1))} style={{ flex: 1, accentColor: "var(--accent)" }} />
              </div>
            </div>
          </div>

          <button onClick={generate} className="btn-primary" style={{ width: "100%", height: "3.5rem", fontWeight: 800, fontSize: "1.05rem" }}>
            Generate Identity
          </button>
        </div>

        {/* Result Card */}
        <div className="card" style={{ minHeight: "450px", display: "flex", alignItems: "flex-start", padding: "2.5rem" }}>
          {!profile ? (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--text-secondary)", minHeight: "350px" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👤</div>
              <p style={{ fontSize: "1.1rem" }}>Configure options to generate a profile.</p>
            </div>
          ) : (
            <div style={{ width: "100%" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                <div>
                  <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.25rem" }}>{profile.name}</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
                    {profile.ethnicity} {profile.gender} · {profile.age} years old · {profile.occupation}
                  </p>
                </div>
                <div style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                  <p style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>DOB</p>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{profile.dob} ({profile.zodiac})</p>
                </div>
              </div>

              {/* Grid 1: Location & Basics */}
              <div className="responsive-grid-2" style={{ gap: "2rem", marginBottom: "2rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Location Hub</h4>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <Field label="Street Address" value={profile.street} />
                    <Field label="City & State" value={`${profile.city}, ${profile.state}`} />
                    <Field label="ZIP Code" value={profile.zip} />
                    <Field label="State License / ID" value={profile.driversLicense} />
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Physical Build</h4>
                  <div className="responsive-grid-2" style={{ gap: "1rem" }}>
                    <Field label="Height" value={profile.height} />
                    <Field label="Weight" value={profile.weight} />
                    <Field label="Skin Tone" value={profile.skinTone} />
                    <Field label="Eye Color" value={profile.eyeColor} />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Field label="Hair Type & Color" value={profile.hairColor} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Background Data */}
              <div>
                <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Civilian Records</h4>
                <div className="responsive-grid-3" style={{ gap: "1rem" }}>
                  <Field label="Blood Type" value={profile.bloodType} />
                  <Field label="Marital Status" value={profile.maritalStatus} />
                  <Field label="Primary Vehicle" value={profile.vehicle} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
                <button onClick={copyInfo} style={{ flex: 1, padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--accent)", cursor: "pointer", fontWeight: 700, backgroundColor: copied ? "var(--accent)" : "transparent", color: copied ? "#fff" : "var(--accent)", transition: "all 0.2s", fontSize: "1rem" }}>
                  {copied ? '✓ Information Copied to Clipboard' : 'Copy Full Profile Data'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>{label}</span>
      <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-primary)" }}>{value}</span>
    </div>
  )
}
