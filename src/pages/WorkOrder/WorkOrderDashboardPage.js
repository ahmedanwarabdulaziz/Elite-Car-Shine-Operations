import React from 'react';
import { useNavigate } from 'react-router-dom';
import WorkOrderDashboard from './WorkOrderDashboard';

const WorkOrderDashboardPage = () => {
  const navigate = useNavigate();

  const handleNavigateToCreate = () => {
    navigate('/work-orders');
  };

  const handleViewWorkOrder = (workOrder) => {
    // Handle view work order - could open a modal or navigate to a view page
    console.log('View work order:', workOrder);
  };

  const handleEditWorkOrder = (workOrder) => {
    // Handle edit work order - could navigate to edit page or open edit modal
    console.log('Edit work order:', workOrder);
  };

  const handleDeleteWorkOrder = (workOrder) => {
    // Handle delete work order - could show confirmation dialog
    console.log('Delete work order:', workOrder);
  };

  return (
    <WorkOrderDashboard
      onNavigateToCreate={handleNavigateToCreate}
      onViewWorkOrder={handleViewWorkOrder}
      onEditWorkOrder={handleEditWorkOrder}
      onDeleteWorkOrder={handleDeleteWorkOrder}
    />
  );
};

export default WorkOrderDashboardPage; 