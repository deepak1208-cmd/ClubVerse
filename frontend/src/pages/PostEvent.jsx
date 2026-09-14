import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api'; // Uses the working API layer

const PostEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    date: '',
    start_time: '', // New: Time
    end_time: '',   // New: Time
    description: '',
    eligibility: '',
    max_participants: '',
    format: '',
    why_participate: '',
    contact_name: '',
    contact_role: '',
    contact_phone: '',
    contact_email: '',
    winners: '',
    registration_type: 'individual', // New: Team mode
    max_teams: '',
    min_team_size: 2,
    max_team_size: '',
    is_multi_day: false
  });

  const [mediaFiles, setMediaFiles] = useState([]);
  const [coverImage, setCoverImage] = useState(null); // New: Cover Image

  // Load data if editing
  useEffect(() => {
    if (id) {
      const loadEvent = async () => {
        try {
          const event = await api.getEventById(id);
          setFormData({
            title: event.title || '',
            venue: event.venue || '',
            date: event.date || '',
            start_time: event.start_time || '',
            end_time: event.end_time || '',
            description: event.description || '',
            eligibility: event.eligibility || '',
            max_participants: event.max_participants || '',
            format: event.format || '',
            why_participate: event.why_participate || '',
            contact_name: event.contact_name || '',
            contact_role: event.contact_role || '',
            contact_phone: event.contact_phone || '',
            contact_email: event.contact_email || '',
            winners: event.winners || '',
            registration_type: event.registration_type || 'individual',
            max_teams: event.max_teams || '',
            min_team_size: event.min_team_size || 2,
            max_team_size: event.max_team_size || '',
            is_multi_day: event.is_multi_day || false
          });
        } catch (err) {
          setError('Failed to load event details');
        }
      };
      loadEvent();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (mediaFiles.length + files.length > 8) {
      alert('Maximum 8 files allowed');
      return;
    }
    setMediaFiles(prev => [...prev, ...files]);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) setCoverImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      // Append Media
      mediaFiles.forEach(file => {
        submitData.append('media', file);
      });

      // Append Cover Image
      if (coverImage) {
        submitData.append('cover', coverImage);
      }

      if (id) {
        await api.updateEvent(id, submitData);
      } else {
        await api.createEvent(submitData);
      }
      
      navigate('/feed');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save event. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 sm:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Manage event' : 'Post an event'}
          </h1>
          {id && formData.title && (
            <p className="text-gray-600 mt-1">{formData.title}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* PHOTOS & VIDEOS */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              PHOTOS & VIDEOS
            </h2>
            
            {/* Cover Image Upload (New) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleCoverChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {coverImage && <p className="text-xs text-green-600 mt-1">Selected: {coverImage.name}</p>}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {mediaFiles.map((file, idx) => (
                <div key={idx} className="aspect-square bg-gray-200 rounded overflow-hidden relative">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m0-3v12"></path></svg>
                  <p className="text-sm text-gray-500">Add photos / videos</p>
                  <p className="text-xs text-gray-500">Up to 8 files at once, 25MB each.</p>
                </div>
                <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </section>

          {/* EDIT DETAILS */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">EDIT DETAILS</h2>
            
            {/* THE BASICS */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">THE BASICS</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  name="title"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="text"
                  name="venue"
                  placeholder="Venue / location (e.g. Ground Floor Seminar Hall)"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* TIME FIELDS (New) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                      <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_multi_day"
                    checked={formData.is_multi_day}
                    onChange={handleChange}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">This runs across multiple days</span>
                </label>

                <textarea
                  name="description"
                  placeholder="Short description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* WHO CAN JOIN */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">WHO CAN JOIN</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  name="eligibility"
                  placeholder="Eligibility (e.g. Only AWS Community Members)"
                  value={formData.eligibility}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="number"
                  name="max_participants"
                  placeholder="Max participants / teams (optional)"
                  value={formData.max_participants}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* TEAM REGISTRATION TOGGLE (New) */}
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Type</label>
                  <select
                    name="registration_type"
                    value={formData.registration_type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md mb-3"
                  >
                    <option value="individual">Individual (Standard RSVP)</option>
                    <option value="team">Team (Tournament Style)</option>
                  </select>

                  {formData.registration_type === 'team' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Max Teams *</label>
                        <input
                          type="number"
                          name="max_teams"
                          value={formData.max_teams}
                          onChange={handleChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Min Team Size</label>
                        <input
                          type="number"
                          name="min_team_size"
                          value={formData.min_team_size}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Max Team Size *</label>
                        <input
                          type="number"
                          name="max_team_size"
                          value={formData.max_team_size}
                          onChange={handleChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FORMAT */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">FORMAT (one point per line)</h3>
              <textarea
                name="format"
                placeholder="e.g. Online Conference&#10;Hybrid Event"
                rows="3"
                value={formData.format}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* WHY PARTICIPATE */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">WHY PARTICIPATE (one point per line)</h3>
              <textarea
                name="why_participate"
                placeholder="e.g. To Boost Up Your Skill&#10;Win Cash Prizes"
                rows="3"
                value={formData.why_participate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* CONTACT PERSON */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">CONTACT PERSON</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="contact_name"
                  placeholder="Name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  name="contact_role"
                  placeholder="Role/Title"
                  value={formData.contact_role}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  name="contact_phone"
                  placeholder="Phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  name="contact_email"
                  placeholder="Email or college id"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* RESULTS */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">RESULTS (add or edit any time, even after the event)</h3>
              <input
                type="text"
                name="winners"
                placeholder="Winners (e.g. Team Nightfall — Best Playable Demo)"
                value={formData.winners}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </section>

          {/* ACTIONS */}
          <div className="pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
            
            {id && (
              <button
                type="button"
                onClick={() => {}} // Add delete handler
                className="w-full mt-4 text-red-600 font-semibold py-2 hover:text-red-800 transition duration-200"
              >
                Delete this event
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEvent;