import { useParams, useLocation, Navigate } from 'react-router-dom';
import PostCreationWorkflow from './PostCreationWorkflow';

export default function WorkflowWrapper() {
  const { id } = useParams();
  const location = useLocation();
  
  if (!id) {
    return <Navigate to="/vehicules" />;
  }

  const vehicleInfo = location.state?.vehicleInfo || {
    marque: 'Véhicule',
    immatriculation: 'N/A'
  };

  return <PostCreationWorkflow vehicleId={id} vehicleInfo={vehicleInfo} />;
}
