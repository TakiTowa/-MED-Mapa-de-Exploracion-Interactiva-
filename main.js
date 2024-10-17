import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [region, setRegion] = useState({
    latitude: 37.78825,  // Ubicación inicial por defecto
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [exploredArea, setExploredArea] = useState([]);

  // Función para pedir permisos en Android
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Guardar las áreas exploradas en AsyncStorage
  const saveExploredAreas = async (areas) => {
    try {
      const jsonValue = JSON.stringify(areas);
      await AsyncStorage.setItem('exploredAreas', jsonValue);
    } catch (e) {
      console.log('Error guardando las áreas exploradas:', e);
    }
  };

  // Cargar las áreas exploradas desde AsyncStorage
  const loadExploredAreas = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('exploredAreas');
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.log('Error cargando las áreas exploradas:', e);
      return [];
    }
  };

  // Calcular la distancia entre dos puntos
  const getDistance = (point1, point2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const lat1 = point1.latitude * (Math.PI / 180);
    const lat2 = point2.latitude * (Math.PI / 180);
    const deltaLat = (point2.latitude - point1.latitude) * (Math.PI / 180);
    const deltaLon = (point2.longitude - point1.longitude) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Retorna la distancia en metros
  };

  // Verificar si un nuevo punto está dentro de un área existente
  const isPointInArea = (point, area) => {
    const distance = getDistance(point, { latitude: area.latitude, longitude: area.longitude });
    return distance <= area.radius;
  };

  useEffect(() => {
    const initLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      // Cargar áreas exploradas al iniciar la app
      const savedAreas = await loadExploredAreas();
      setExploredArea(savedAreas);

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setRegion({
            ...region,
            latitude,
            longitude,
          });
          updateExploredArea(latitude, longitude);
        },
        (error) => console.log(error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    };

    initLocation();
  }, []);

  // Actualizar las áreas exploradas
  const updateExploredArea = (latitude, longitude) => {
    setExploredArea((prev) => {
      let updated = false;
      const newAreas = prev.map((area) => {
        if (isPointInArea({ latitude, longitude }, area)) {
          updated = true;
          return { ...area, radius: Math.max(area.radius, 300) }; // Aumentar el radio si es necesario
        }
        return area;
      });

      if (!updated) {
        newAreas.push({ latitude, longitude, radius: 300 });
      }

      saveExploredAreas(newAreas);  // Guardar las áreas unificadas
      return newAreas;
    });
  };

  // Seguir los movimientos del usuario
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setRegion({
          ...region,
          latitude,
          longitude,
        });
        updateExploredArea(latitude, longitude);
      },
      (error) => console.log(error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => Geolocation.clearWatch(watchId);
  }, [region]);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        followUserLocation={true}
      >
        {exploredArea.map((area, index) => (
          <Circle
            key={index}
            center={{ latitude: area.latitude, longitude: area.longitude }}
            radius={area.radius}
            strokeColor="transparent"
            fillColor="rgba(0, 0, 0, 0.5)"  // Representa la neblina
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
