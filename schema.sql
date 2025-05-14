-- ===============================
-- PLAYERS & COMPANIES
-- ===============================
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  auth0_id TEXT UNIQUE NOT NULL,
  in_game_name TEXT NOT NULL,
  sex TEXT,
  ethnicity TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  name TEXT NOT NULL,
  logo TEXT,
  is_illegal BOOLEAN DEFAULT FALSE,
  hq_lat DOUBLE PRECISION,
  hq_lng DOUBLE PRECISION,
  policies JSONB,
  balance NUMERIC DEFAULT 50000, -- Starting money
  premium_vouchers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- VEHICLES
-- ===============================
CREATE TABLE ground_vehicles (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  model TEXT,
  condition INTEGER DEFAULT 100,
  fuel_level NUMERIC DEFAULT 100,
  assigned_contract INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rail_vehicles (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  model TEXT,
  condition INTEGER DEFAULT 100,
  fuel_level NUMERIC DEFAULT 100,
  assigned_contract INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE air_vehicles (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  model TEXT,
  condition INTEGER DEFAULT 100,
  fuel_level NUMERIC DEFAULT 100,
  assigned_contract INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ship_vehicles (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  model TEXT,
  condition INTEGER DEFAULT 100,
  fuel_level NUMERIC DEFAULT 100,
  assigned_contract INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- BUILDINGS
-- ===============================
CREATE TABLE buildings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  type TEXT CHECK (type IN (
    'headquarters', 'service_station', 'warehouse', 'industry',
    'rail_yard', 'sea_port', 'airport', 'police_station', 'impound_lot'
  )),
  name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- GOODS, CARGO, CONTRACTS
-- ===============================
CREATE TABLE goods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('dry', 'liquid', 'gas', 'people')) NOT NULL
);

CREATE TABLE cargo (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id),
  good_id INTEGER REFERENCES goods(id),
  quantity INTEGER NOT NULL,
  weight_kg NUMERIC,
  volume_m3 NUMERIC
);

CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  origin_building_id INTEGER REFERENCES buildings(id),
  destination_building_id INTEGER REFERENCES buildings(id),
  assigned_company_id INTEGER REFERENCES companies(id),
  reward NUMERIC,
  deadline TIMESTAMP,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- LOGOS (used in onboarding)
-- ===============================
CREATE TABLE logos (
  id SERIAL PRIMARY KEY,
  name TEXT,
  image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);
