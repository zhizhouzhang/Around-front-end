import React from 'react';
import { withScriptjs, withGoogleMap, GoogleMap } from "react-google-maps";
import { POS_KEY } from '../constants';
import { AroundMarker } from './AroundMarker';

class NormalAroundMap extends React.Component {

    reloadMarkers = () => {
        const center = this.getCenter();
        const radius = this.getRadius();

        this.props.loadNearbyPosts(center, radius);
    }

    getCenter = () => {
        const center = this.map.getCenter();
        return {
            lat: center.lat(),
            lon: center.lng()
        };
    }

    getRadius = () => {
        const center = this.map.getCenter();
        const bounds = this.map.getBounds();
        if (center && bounds) {
            const ne = bounds.getNorthEast();
            const right = new window.google.maps.LatLng(center.lat(), ne.lng());
            return 0.001 * window.google.maps.geometry.spherical.computeDistanceBetween(center, right);
        }
    }

    getMapRef = (instance) => {
        this.map = instance;
    }

    render() {
        const { lat, lon: lng } = JSON.parse(localStorage.getItem(POS_KEY));
        return (
            <GoogleMap
                ref={this.getMapRef}
                defaultZoom={11}
                defaultCenter={{ lat, lng }}
                onDragEnd={this.reloadMarkers}
                onZoomChanged={this.reloadMarkers}
            >
                {
                    this.props.posts.map((post) => <AroundMarker post={post} />)
                }

            </GoogleMap>
        );
    }
}

export const AroundMap = withScriptjs(withGoogleMap(NormalAroundMap));