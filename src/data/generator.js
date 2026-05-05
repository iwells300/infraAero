
// Realistic Spanish Names
const FIRST_NAMES = ['Alejandro', 'Lucía', 'Mateo', 'Sofía', 'Daniel', 'Valentina', 'Pablo', 'Martina', 'Álvaro', 'Julia', 'David', 'Carla', 'Javier', 'Elena', 'Hugo'];
const LAST_NAMES = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín'];

const AGENT_PHOTOS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=256',
];

const STREETS = {
  madrid: ['Calle de Alcalá', 'Paseo de la Castellana', 'Calle Gran Vía', 'Calle de Velázquez', 'Calle de Serrano', 'Avenida de América'],
  barcelona: ['Passeig de Gràcia', 'Avinguda Diagonal', 'Carrer d\'Aragó', 'La Rambla', 'Carrer de Balmes'],
  valencia: ['Carrer de Colón', 'Avinguda de Blasco Ibáñez', 'Carrer de Xàtiva', 'Gran Via del Marqués del Túria']
};

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-22b4899b7139?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800'
];

// Helper Functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Generators
export const generateAgents = (count = 8) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `A${i + 1}`,
    name: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
    photo: AGENT_PHOTOS[i % AGENT_PHOTOS.length],
    seniority: randomNumber(1, 15) + ' años',
    rating: randomFloat(3.5, 5.0),
    activeDeals: 0, // Calculated later
    closedDeals: 0, // Calculated later
    totalSales: 0,  // Calculated later
    totalCommission: 0 // Calculated later
  }));
};

export const generateProperties = (agents, count = 35) => {
  const statuses = ['Captado', 'En comercialización', 'Visitas programadas', 'Oferta recibida', 'Reservado', 'Vendido', 'Alquilado'];
  const cities = ['Madrid', 'Barcelona', 'Valencia'];
  const types = ['Venta', 'Alquiler'];
  
  return Array.from({ length: count }, (_, i) => {
    const city = randomItem(cities);
    const type = randomItem(types);
    const price = type === 'Venta' ? randomNumber(150, 850) * 1000 : randomNumber(800, 2500);
    const agent = randomItem(agents);
    const status = randomItem(statuses);
    
    return {
      id: `P${i + 1}`,
      title: `${type === 'Venta' ? 'Pisa en venta' : 'Apartamento en alquiler'} en ${city}`,
      address: `${randomItem(STREETS[city.toLowerCase()])} ${randomNumber(1, 200)}, ${city}`,
      city,
      type,
      price,
      area: randomNumber(60, 250),
      rooms: randomNumber(1, 5),
      baths: randomNumber(1, 3),
      image: randomItem(PROPERTY_IMAGES),
      status,
      agentId: agent.id,
      dateListed: randomDate(new Date(2025, 0, 1), new Date()),
      visits: randomNumber(0, 50),
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    };
  });
};

export const generateTransactions = (properties, agents) => {
  const closedProperties = properties.filter(p => p.status === 'Vendido' || p.status === 'Alquilado');
  
  return closedProperties.map((prop, i) => {
    const commissionRate = prop.type === 'Venta' ? 0.03 : 1; // 3% or 1 month
    const commission = prop.type === 'Venta' ? prop.price * commissionRate : prop.price;
    const date = randomDate(prop.dateListed, new Date());
    
    return {
      id: `T${i + 1}`,
      propertyId: prop.id,
      agentId: prop.agentId,
      date,
      finalPrice: prop.price, // Simplified, assume full price
      commission,
      type: prop.type,
      status: 'Completado'
    };
  });
};

// Initial State Builder
export const buildInitialState = () => {
  let agents = generateAgents(8);
  let properties = generateProperties(agents, 40);
  
  // Update properties status to meaningful distribution
  // ... (logic to ensure we have sold items for transactions)
  
  // Force some SOLD/RENTED
  properties = properties.map((p, i) => {
    if (i < 15) return { ...p, status: p.type === 'Venta' ? 'Vendido' : 'Alquilado' };
    return p;
  });

  const transactions = generateTransactions(properties, agents);
  
  // Calculate Agent Metrics based on transactions
  agents = agents.map(agent => {
    const agentTrans = transactions.filter(t => t.agentId === agent.id);
    const activeProps = properties.filter(p => p.agentId === agent.id && p.status !== 'Vendido' && p.status !== 'Alquilado');
    
    const salesTotal = agentTrans.reduce((sum, t) => sum + t.finalPrice, 0);
    const commTotal = agentTrans.reduce((sum, t) => sum + t.commission, 0);
    
    return {
      ...agent,
      activeDeals: activeProps.length,
      closedDeals: agentTrans.length,
      totalSales: salesTotal,
      totalCommission: commTotal
    };
  });

  return { agents, properties, transactions };
};
