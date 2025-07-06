import React, { useEffect, useState } from 'react';
import { Clock, MapPin, AlertCircle, CheckCircle, Navigation, Wifi, Battery } from 'lucide-react';
import { supabase, Attendance as AttendanceType } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

// MYISU Campus Location - Updated with accurate coordinates
const CAMPUS_LOCATION = {
  latitude: 24.552041628310768,
  longitude: 46.684321294327596,
  name: 'MYISU University Campus',
  address: 'Al Shaikh Al Nawaoui, Ash Shifa, Riyadh 14721'
};

const ALLOWED_DISTANCE = 500; // 500m radius for more precise attendance

const Attendance: React.FC = () => {
  const { t } = useTranslation();
  const [attendance, setAttendance] = useState<AttendanceType[]>([]);
  const [clockInError, setClockInError] = useState('');
  const [clockInSuccess, setClockInSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingin] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, accuracy?: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'getting' | 'success' | 'error'>('getting');
  const [distanceFromCampus, setDistanceFromCampus] = useState<number | null>(null);

  useEffect(() => {
    fetchAttendance();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLocationStatus('getting');
    
    if (!navigator.geolocation) {
      setClockInError('Geolocation is not supported by this browser.');
      setLocationStatus('error');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setUserLocation(location);
        setLocationStatus('success');
        
        const distance = calculateDistance(
          location.lat,
          location.lng,
          CAMPUS_LOCATION.latitude,
          CAMPUS_LOCATION.longitude
        );
        setDistanceFromCampus(distance);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        setClockInError(errorMessage);
        setLocationStatus('error');
      },
      options
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const fetchAttendance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (attendanceData) setAttendance(attendanceData);
    setLoading(false);
  };

  const handleClockIn = async () => {
    setClockInError('');
    setClockInSuccess('');
    setClockingin(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setClockInError('You must be logged in to clock in.');
      setClockingin(false);
      return;
    }

    // Check if user location is available
    if (!userLocation) {
      setClockInError('Unable to get your location. Please enable location services and try again.');
      setClockingin(false);
      return;
    }

    // Check if user is on campus
    const distance = distanceFromCampus || calculateDistance(
      userLocation.lat,
      userLocation.lng,
      CAMPUS_LOCATION.latitude,
      CAMPUS_LOCATION.longitude
    );

    if (distance > ALLOWED_DISTANCE) {
      setClockInError(`You must be within ${ALLOWED_DISTANCE}m of campus to clock in. You are ${Math.round(distance)}m away.`);
      setClockingin(false);
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Check time windows: 8:45-9:15 AM and 1:45-2:15 PM
    const isMorning = (currentHour === 8 && currentMinutes >= 45) || (currentHour === 9 && currentMinutes <= 15);
    const isAfternoon = (currentHour === 13 && currentMinutes >= 45) || (currentHour === 14 && currentMinutes <= 15);

    if (!isMorning && !isAfternoon) {
      setClockInError('You are outside the clock-in window. Available times: 8:45-9:15 AM and 1:45-2:15 PM.');
      setClockingin(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existing) {
      setClockInError('You have already clocked in today.');
      setClockingin(false);
      return;
    }

    // Determine if late
    const isLate = (currentHour === 9 && currentMinutes > 0) || (currentHour === 14 && currentMinutes > 0);
    const status = isLate ? 'late' : 'present';

    // Insert into attendance_records table
    const { data, error } = await supabase
      .from('attendance_records')
      .insert([{
        student_id: user.id,
        course_id: null,
        timestamp: now.toISOString(),
        location_lat: userLocation.lat,
        location_lng: userLocation.lng
      }])
      .select();

    if (error) {
      console.error('Clock-in error:', error);
      setClockInError('An error occurred while clocking in. Please try again.');
    } else if (data) {
      setClockInSuccess(`Successfully clocked in! Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`);
      fetchAttendance();
    }

    setClockingin(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'late':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'absent':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case 'getting':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const isWithinCampus = distanceFromCampus !== null && distanceFromCampus <= ALLOWED_DISTANCE;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-8 w-8" />
          <h2 className="text-3xl font-bold">Smart Attendance</h2>
        </div>
        <p className="text-blue-100">Location-based attendance tracking system</p>
      </div>

      <div className="p-6">
        {/* Location Status Card */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Location Status</h3>
            </div>
            {getLocationStatusIcon()}
          </div>
          
          {userLocation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">
                  Accuracy: ±{userLocation.accuracy?.toFixed(0) || 'Unknown'}m
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Battery className="h-4 w-4 text-orange-600" />
                <span className="text-gray-700">
                  Distance: {distanceFromCampus ? `${Math.round(distanceFromCampus)}m` : 'Calculating...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Map */}
        <div className="mb-6 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Campus Map</h3>
            </div>
          </div>
          
          <div className="relative h-64 bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Embedded Google Maps */}
            <iframe
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3623.123456789!2d${CAMPUS_LOCATION.longitude}!3d${CAMPUS_LOCATION.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDMzJzA3LjQiTiA0NsKwNDEnMDMuNiJF!5e0!3m2!1sen!2ssa!4v1234567890123`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-b-xl"
            />
            
            {/* Campus Info Overlay */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${isWithinCampus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-semibold text-sm text-gray-900">
                  {isWithinCampus ? 'Within Campus' : 'Outside Campus'}
                </span>
              </div>
              <p className="text-xs text-gray-600">{CAMPUS_LOCATION.address}</p>
              <p className="text-xs text-blue-600 mt-1">
                Allowed radius: {ALLOWED_DISTANCE}m
              </p>
            </div>
          </div>
        </div>

        {/* Clock-in Times */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Attendance Windows</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="font-medium text-gray-900">Morning Session</span>
              </div>
              <p className="text-sm text-gray-700">8:45 AM - 9:15 AM</p>
              <p className="text-xs text-gray-500">Late after 9:00 AM</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="font-medium text-gray-900">Afternoon Session</span>
              </div>
              <p className="text-sm text-gray-700">1:45 PM - 2:15 PM</p>
              <p className="text-xs text-gray-500">Late after 2:00 PM</p>
            </div>
          </div>
        </div>

        {/* Clock In Button */}
        <div className="mb-6">
          <button
            onClick={handleClockIn}
            disabled={clockingIn || !isWithinCampus || locationStatus !== 'success'}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
              clockingIn || !isWithinCampus || locationStatus !== 'success'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105 active:scale-95'
            }`}
          >
            {clockingIn ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                <span>Processing Attendance...</span>
              </div>
            ) : !isWithinCampus ? (
              <div className="flex items-center justify-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Move Closer to Campus</span>
              </div>
            ) : locationStatus !== 'success' ? (
              <div className="flex items-center justify-center space-x-2">
                <Navigation className="h-5 w-5" />
                <span>Getting Location...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Clock In Now</span>
              </div>
            )}
          </button>
          
          {!isWithinCampus && distanceFromCampus && (
            <p className="text-center text-sm text-orange-600 mt-2">
              You need to be {Math.round(distanceFromCampus - ALLOWED_DISTANCE)}m closer to campus
            </p>
          )}
        </div>

        {/* Success Message */}
        {clockInSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-green-800 font-semibold">{clockInSuccess}</p>
                <p className="text-green-600 text-sm">Your attendance has been recorded successfully</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {clockInError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-red-800 font-semibold">Unable to Clock In</p>
                <p className="text-red-600 text-sm">{clockInError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Recent Attendance</span>
          </h3>
          <div className="space-y-3">
            {attendance.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No attendance records yet</p>
                <p className="text-gray-400 text-sm">Your attendance history will appear here</p>
              </div>
            ) : (
              attendance.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className={`p-4 rounded-xl border-2 ${getStatusColor(record.status)} transition-all duration-200 hover:shadow-lg hover:scale-[1.02]`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-lg mb-1">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-medium">
                          Status: <span className="capitalize">{t(`attendance.${record.status}`)}</span>
                        </span>
                        {record.clock_in_time && (
                          <span className="text-gray-600">
                            {new Date(record.clock_in_time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(record.status)}`}>
                      {t(`attendance.${record.status}`)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;