import React from 'react';
import { Plus, History, Paperclip, X, Eye, Trash2, Edit3, AlertTriangle, MoreVertical } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'studentRequests';

const getStatusClass = (status) => {
  switch (status) {
    case 'Approved':
      return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400';
    case 'Rejected':
      return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};


const RequestFormModal = ({ isOpen, onClose, onSave, request }) => {
  const [fileName, setFileName] = React.useState(request?.attachmentName || '');
  const [error, setError] = React.useState('');
  const isEditMode = !!request;

  React.useEffect(() => {
    if (isOpen) {
        setFileName(request?.attachmentName || '');
        setError('');
    }
  }, [isOpen, request]);

  if (!isOpen) return null;

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileName(event.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const requestData = {
      type: formData.get('requestType'),
      to: formData.get('to'),
      reason: formData.get('reason'),
      attachmentName: fileName,
    };

    if (!requestData.type || !requestData.to.trim() || !requestData.reason.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    
    onSave(requestData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in-0 zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">{isEditMode ? 'Edit Request' : 'Create New Request'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           {error && <div className="p-3 text-sm text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-lg">{error}</div>}
          
          {/* Form fields */}
          <div>
            <label htmlFor="requestType" className="block text-sm font-medium mb-1">Type of Request</label>
            <select id="requestType" name="requestType" defaultValue={request?.type || 'To be Excused'} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option>To be Excused</option>
              <option>Permission</option>
              <option>Send Attachment</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="to" className="block text-sm font-medium mb-1">To (Teacher's Name)</label>
            <input type="text" id="to" name="to" defaultValue={request?.to || ''} placeholder="e.g., Mr. John Smith" className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1">Reason / Description</label>
            <textarea id="reason" name="reason" rows="4" defaultValue={request?.reason || ''} placeholder="State your reason clearly..." className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Attachment</label>
             <label htmlFor="attachment" className="cursor-pointer flex items-center justify-center gap-2 w-full px-3 py-2 bg-white dark:bg-gray-900 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                <Paperclip size={16} />
                <span className="truncate">{fileName || 'Attach a file'}</span>
             </label>
             <input type="file" id="attachment" className="hidden" onChange={handleFileChange} />
             <p className="text-xs text-muted-foreground mt-1">Optional. Max file size: 5MB.</p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// modal for view button

const ViewRequestModal = ({ isOpen, onClose, request, onEdit }) => {
    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in-0 zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                    <h2 className="text-lg font-semibold">Request Details</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-md font-semibold">{request.type}</h3>
                        <div className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusClass(request.status)}`}>{request.status}</div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">To</p>
                        <p>{request.to}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">Date Requested</p>
                        <p>{request.date}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Reason</p>
                        <p className="whitespace-pre-wrap break-words">{request.reason}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Attachment</p>
                        <p>{request.attachmentName || 'None'}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
                    {request.status === 'Pending' && (
                        <button onClick={() => { onClose(); onEdit(); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                            <Edit3 size={16} /> Edit
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">Close</button>
                </div>
            </div>
        </div>
    );
};

// deleting request

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in-0 zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">Remove Request?</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This action cannot be undone. Are you sure you want to permanently remove this request?
                    </p>
                </div>
                <div className="flex justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
                    <button onClick={onClose} type="button" className="px-6 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">
                        Cancel
                    </button>
                    <button onClick={onConfirm} type="button" className="px-6 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Request() {
  const [requests, setRequests] = React.useState(() => {
    try {
      const savedRequests = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedRequests ? JSON.parse(savedRequests) : [];
    } catch (error) {
      console.error("Failed to parse requests from local storage:", error);
      return [];
    }
  });

  const [isCreateModalOpen, setCreateModalOpen] = React.useState(false);
  const [isViewModalOpen, setViewModalOpen] = React.useState(false);
  const [isEditModalOpen, setEditModalOpen] = React.useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [requestToDeleteId, setRequestToDeleteId] = React.useState(null);
  const [openDropdownId, setOpenDropdownId] = React.useState(null);

  React.useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
        if (openDropdownId && !event.target.closest('.action-dropdown-container')) {
            setOpenDropdownId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const handleAddRequest = (newRequestData) => {
    const newRequest = {
      id: Date.now(),
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      ...newRequestData,
    };
    setRequests(prev => [newRequest, ...prev]);
  };

  const handleUpdateRequest = (updatedData) => {
    setRequests(prev => prev.map(req => 
        req.id === selectedRequest.id ? { ...req, ...updatedData } : req
    ));
    setSelectedRequest(null);
  };
  
  const handleViewClick = (request) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
  }

  const handleDeleteClick = (id) => {
    setRequestToDeleteId(id);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setRequests(prev => prev.filter(req => req.id !== requestToDeleteId));
    setConfirmModalOpen(false);
    setRequestToDeleteId(null);
  };
  
  const handleDropdownToggle = (requestId) => {
    setOpenDropdownId(prevId => (prevId === requestId ? null : requestId));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
      <RequestFormModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSave={handleAddRequest} />
      <RequestFormModal isOpen={isEditModalOpen} onClose={() => {setEditModalOpen(false); setSelectedRequest(null);}} onSave={handleUpdateRequest} request={selectedRequest} />
      <ViewRequestModal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} request={selectedRequest} onEdit={handleEditClick} />
      <ConfirmDeleteModal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)} onConfirm={handleConfirmDelete} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div>
          <h1 className="text-2xl font-bold tracking-tight">My Requests</h1>
          <p className="text-muted-foreground">Manage your document and absence requests.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <History size={16} />
                <span>History</span>
            </button>
           <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
             <Plus size={16} />
             <span>Create Request</span>
           </button>
        </div>
      </div>

      {/* List of requests */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 hidden sm:flex justify-between items-center text-sm font-semibold text-muted-foreground border-b dark:border-gray-800">
          <span className="flex-grow">Type of Request</span>
          <span className="w-40 text-center">Status</span>
          <span className="w-20 text-right">Actions</span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {requests.length > 0 ? (
                requests.map(request => (
                    <div key={request.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex-grow">
                            <p className="font-semibold">{request.type}</p>
                            <p className="text-sm text-muted-foreground">To: {request.to}</p>
                        </div>
                        <div className="w-full sm:w-32 flex sm:justify-center">
                            <div className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${getStatusClass(request.status)}`}>
                                {request.status}
                            </div>
                        </div>
                        <div className="relative sm:w-20 flex justify-end action-dropdown-container">
                           <button onClick={() => handleDropdownToggle(request.id)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-muted-foreground">
                            <MoreVertical size={18}/>
                           </button>
                           {openDropdownId === request.id && (
                               <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-20 animate-in fade-in-0 zoom-in-95">
                                   <ul className="py-1">
                                       <li>
                                           <button onClick={() => { handleViewClick(request); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                                               <Eye size={16}/>
                                               <span>View Details</span>
                                           </button>
                                       </li>
                                       <li>
                                           <button onClick={() => { handleDeleteClick(request.id); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">
                                               <Trash2 size={16}/>
                                               <span>Remove</span>
                                           </button>
                                       </li>
                                   </ul>
                               </div>
                           )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    You have no active requests. Click "Create Request" to start.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}