import React from 'react';
import styled from 'styled-components';
import { Settings, AlertCircle, Play, CheckCircle2, Clock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { create } from 'zustand';

// --- 1. LE STORE (Logique de données) ---
const useStore = create((set) => ({
 tasks: [
    { id: 'T1', title: 'Prod Volet RS100', machineId: 'M1', progress: 70, priority: 'High' },
    { id: 'T2', title: 'Prod Bras TS441', machineId: 'M1', progress: 20, priority: 'Medium' },
    { id: 'T3', title: 'Prod Moteur Kit', machineId: 'M2', progress: 100, priority: 'Low' },
  ],

  previousState: null,

  moveTask: (taskId, newMachineId) => set((state) => {
    // On sauvegarde l'état actuel avant de modifier
    const currentState = { tasks: [...state.tasks] }; 
    return {
      previousState: currentState,
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, machineId: newMachineId } : t)
    };
  }),

  undo: () => set((state) => {
    if (!state.previousState) return state;
    return { 
      tasks: state.previousState.tasks, 
      previousState: null // On vide après l'annulation
    };
  }),

  simulateProgress: () => set((state) => ({
    tasks: state.tasks.map(t => ({
      ...t,
      progress: t.progress < 100 ? Math.min(t.progress + 5, 100) : 100
    }))
  })),

  deleteTask: (taskId) => set((state) => ({
    previousState: { tasks: [...state.tasks] },
    tasks: state.tasks.filter(t => t.id !== taskId)
  })),
}));

// --- 2. LES COMPOSANTS STYLISÉS (Le Design) ---
const Container = styled.div`
  background: #0f172a;
  min-height: 100vh;
  padding: 40px;
  color: white;
  font-family: 'Inter', sans-serif;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
`;

const Header = styled.header`
  border-left: 5px solid #ff5f00;
  padding-left: 20px;
  h1 { margin: 0; font-size: 24px; letter-spacing: -0.5px; }
  span { color: #94a3b8; font-size: 14px; }
`;

const Board = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
`;

const MachineCard = styled.div`
  background: ${props => props.$isOverloaded ? '#451a1a' : '#1e293b'};
  width: 320px;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${props => props.$isOverloaded ? '#ef4444' : '#334155'};
  transition: all 0.3s ease;
`;

// Badge de priorité
const PriorityBadge = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.$level === 'High') return '#ef4444';
    if (props.$level === 'Medium') return '#f59e0b';
    return '#3b82f6';
  }};
`;

const TaskBox = styled.div`
  background: #334155;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 4px solid ${props => props.$isCompleted ? '#22c55e' : '#ff5f00'};
  cursor: grab;
  transition: transform 0.2s, background 0.2s;
  &:hover {
    background: #3f4e64;
  }
`;

const StatusBadge = styled.span`
  background: ${props => props.type === 'completed' ? '#22c55e22' : '#ff5f0022'};
  color: ${props => props.type === 'completed' ? '#22c55e' : '#ffb380'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ProgressBarContainer = styled.div`
  height: 6px;
  background: #0f172a;
  border-radius: 10px;
  margin-top: 12px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background: ${props => props.progress === 100 ? '#22c55e' : 'linear-gradient(90deg, #ff5f00, #ff985a)'};
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
`;

const StopButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: '0 20px',
  border-radius: 6px;
  fontWeight: '600'
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  &:hover { background: #dc2626; transform: scale(1.05); }
  &:active { transform: scale(0.95); }
`;

const SimulateButton = styled.button`
  background: '#334155', 
  color: 'white', 
  border: '1px solid #475569',
  padding: '0 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600'
`;

const TrashZone = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 2px dashed ${props => props.$isDraggingOver ? '#ef4444' : '#334155'};
  background: ${props => props.$isDraggingOver ? '#ef444422' : 'transparent'};
  border-radius: 8px;
  text-align: center;
  color: ${props => props.$isDraggingOver ? '#ef4444' : '#64748b'};
`;

// --- 3. L'APPLICATION ---
function App() {
  const { tasks, moveTask,simulateProgress, undo, previousState,deleteTask
   } = useStore();
  const machines = [
    { id: 'M1', name: 'Ligne 001', type: 'Assemblage' },
    { id: 'M2', name: 'Ligne 002', type: 'Packaging' }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      simulateProgress();
    }, 5000); // Avancement auto toutes les 5 secondes

    return () => clearInterval(interval);
  }, [simulateProgress]);
  
const onDragEnd = (result) => {
  const { destination, draggableId } = result;
  if (!destination) return;

  // Si on dépose dans la corbeille
  if (destination.droppableId === 'trash') {
    deleteTask(draggableId);
    return;
  }
  
  moveTask(draggableId, destination.droppableId);
};

  return (
    <Container>
      <HeaderContainer>
        <Header>
          <h1>SOMFY | Smart-Orchestrator</h1>
          <span>Poste de contrôle OT - Temps Réel</span>
        </Header>
        <StopButton onClick={() => alert('ARRÊT D\'URGENCE LANCÉ')}>
          <AlertCircle size={20} /> ARRÊT D'URGENCE
        </StopButton>
        <SimulateButton 
          onClick={simulateProgress}
        >
          Simuler Production
        </SimulateButton>
        <SimulateButton 
          onClick={undo} 
          disabled={!previousState}
          style={{ opacity: previousState ? 1 : 0.5 }}
        >
          Annuler Dernière Action
        </SimulateButton>
      </HeaderContainer>

      <DragDropContext onDragEnd={onDragEnd}>
        <Board>
          {machines.map(machine => {
            const machineTasks = tasks.filter(t => t.machineId === machine.id);
            const isOverloaded = machineTasks.length > 2;

            return (
              <MachineCard key={machine.id} $isOverloaded={isOverloaded}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{machine.name}</strong>
                  <Settings size={18} color="#94a3b8" />
                </div>
                
                {isOverloaded && <div style={{color: '#ef4444', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px'}}>⚠️ SURCHARGE LIGNE</div>}

                <Droppable droppableId={machine.id}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} style={{ minHeight: '150px' }}>
                      {machineTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <TaskBox
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              $isCompleted={task.progress === 100}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PriorityBadge $level={task.priority} />
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{task.title}</div>
                              </div>
                              
                              <ProgressBarContainer>
                                <ProgressFill progress={task.progress} />
                              </ProgressBarContainer>
                            </TaskBox>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </MachineCard>
            );
          })}
        </Board>
        <Droppable droppableId="trash">
          {(provided, snapshot) => (
            <TrashZone ref={provided.innerRef} {...provided.droppableProps} $isDraggingOver={snapshot.isDraggingOver}>
              {snapshot.isDraggingOver ? "⚠️ Relâcher pour supprimer" : "🗑️ Glisser ici pour retirer du flux"}
              {provided.placeholder}
            </TrashZone>
          )}
        </Droppable>
      </DragDropContext>
    </Container>
  );
}

export default App;