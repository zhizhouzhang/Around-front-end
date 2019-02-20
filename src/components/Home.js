import React from 'react';
import { Tabs, Button, Spin, Row, Col, Radio } from 'antd';
import { GEO_OPTIONS, POS_KEY, API_ROOT, AUTH_HEADER, TOKEN_KEY } from '../constants';
import { Gallery } from './Gallery';
import { CreatePostButton } from './CreatePostButton';
import { AroundMap } from './AroundMap';

const TabPane = Tabs.TabPane;
const RadioGroup = Radio.Group;

export class Home extends React.Component {
    state = {
        isLoadingGeoLocataion: false,
        error: '',
        isLoadingPosts: false,
        posts: [],
        topic: 'around'
    }

    componentDidMount() {
        if ('geolocation' in navigator) {
            this.setState({
                isLoadingGeoLocation: true
            });
            navigator.geolocation.getCurrentPosition(
                this.onSuccessLoadGeoLocation,
                this.onFailedLoadGeoLocation,
                GEO_OPTIONS
            );
        } else {
            this.setState({ error: 'Geolocation is not supported.' });
        }
    }

    onSuccessLoadGeoLocation = (position) => {
        const { longitude, latitude } = position.coords;
        localStorage.setItem(POS_KEY, JSON.stringify({
            lat: latitude,
            lon: longitude
        }));
        this.setState({ isLoadingGeoLocation: false, error: '' });
        this.loadNearbyPosts();
    }

    onFailedLoadGeoLocation = (error) => {
        this.setState({
            isLoadingGeoLocation: false,
            error: 'Failed to get geolocation: ' + error.message
        });
    }

    loadNearbyPosts = (center, radius) => {
        const { lat, lon } = center ? center : JSON.parse(localStorage.getItem(POS_KEY));
        const range = radius ? radius : 20;
        const token = localStorage.getItem(TOKEN_KEY);

        this.setState({ isLoadingPosts: true, error: '' });

        fetch(`${API_ROOT}/search?lat=${lat}&lon=${lon}&range=${range}`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`
            }
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        }).then((posts) => {
            console.log(posts);
            this.setState({ isLoadingPosts: false, posts: posts || [] });
        }).catch((e) => {
            this.setState({ isLoadingPosts: false, error: e.message });
        });
    }

    getPanelContent = (type) => {
        const { error, isLoadingGeoLocation, isLoadingPosts, posts } = this.state;
        if (error) {
            return <div>{error}</div>;
        } else if (isLoadingGeoLocation) {
            return <Spin tip="Loading geo location..." />;
        } else if (isLoadingPosts) {
            return <Spin tip="Loading posts..." />;
        } else if (posts && posts.length > 0) {
            return type === "image" ? this.getImagePosts(): this.getVideoPosts()
        } else {
            return <div>No nearby posts.</div>;
        }
    }

    getImagePosts = () => {
        const { posts } = this.state;

        return <Gallery images={
            posts.filter(({type}) => type === "image").map(({ user, url, message }) => ({
                user,
                src: url,
                thumbnail: url,
                caption: message,
                thumbnailWidth: 400,
                thumbnailHeight: 300
            }))
        } />;
    }

    getVideoPosts = () => {
        const { posts } = this.state;

        // TODO: rewrite Row/Col -> display: flex
        return (
            <Row gutter={32}>
                {
                    posts
                        .filter(({type}) => type === "video")
                        .map(({ user, url, message }) => (
                            <Col span={6}>
                                <video src={url} controls className="video-block" />
                                <p>{`${user}: ${message}`}</p>
                            </Col>
                        ))
                }
            </Row>
        );
    }

    onTopicChange = (e) => {
        this.setState({
            topic: e.target.value
        });

        if (e.target.value === "around") {
            this.loadNearbyPosts();
        } else {
            this.loadFacesAroundTheWorld();
        }
    }

    loadFacesAroundTheWorld = () => {
        const token = localStorage.getItem(TOKEN_KEY);

        this.setState({ isLoadingPosts: true, error: '' });
        fetch(`${API_ROOT}/cluster?term=face`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`
            }
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        }).then((posts) => {
            console.log(posts);
            this.setState({ isLoadingPosts: false, posts: posts || [] });
        }).catch((e) => {
            this.setState({ isLoadingPosts: false, error: e.message });
        });
    }

    render() {
        const operations = <CreatePostButton loadNearbyPosts={this.loadNearbyPosts} />;

        return (
            <div>
                <RadioGroup onChange={this.onTopicChange} value={this.state.topic}>
                    <Radio value="around">Posts Around Me</Radio>
                    <Radio value="face">Faces Around The World</Radio>
                </RadioGroup>
                <Tabs className="main-tabs" tabBarExtraContent={operations}>
                    <TabPane tab="Image Posts" key="1">
                        {this.getPanelContent("image")}
                    </TabPane>
                    <TabPane tab="Video Posts" key="2">
                        {this.getPanelContent("video")}
                    </TabPane>
                    <TabPane tab="Map" key="3">
                        <AroundMap
                            googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyD3CEh9DXuyjozqptVB5LA-dN7MxWWkr9s&v=3.exp&libraries=geometry,drawing,places"
                            loadingElement={<div style={{ height: `100%` }} />}
                            containerElement={<div style={{ height: `600px` }} />}
                            mapElement={<div style={{ height: `100%` }} />}
                            posts={this.state.posts}
                            loadNearbyPosts={this.state.topic === "around" ? this.loadNearbyPosts: this.loadFacesAroundTheWorld}
                        />
                    </TabPane>
                </Tabs>
            </div>
        );
    }
}
