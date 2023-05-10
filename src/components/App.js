import React, {useState, useEffect} from 'react';
import { useNavigate, Navigate, Route, Routes } from 'react-router-dom';
import api from '../utils/Api';
import '../index.css';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import ImagePopup from './ImagePopup';
import AddPlacePopup from './AddPlacePopup';
import EditProfilePopup from './EditProfilePopup';
import EditAvatarPopup from './EditAvatarPopup';
import { CurrentUserContext } from '../contexts/CurrentUserContext';
import apiAuth from '../utils/ApiAuth';
import Register from './Register';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import NavBar from './NavBar';
import InfoTooltip from './InfoTooltip';

function App() {

	const navigate = useNavigate();
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [userData, setUserData] = useState({
		_id: "",
		email: ""
	});
	const [token, setToken] = useState("");
	const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
	const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
	const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
	const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
	const [selectedCard, setSelectedCard] = useState({});
	const [currentUser, setCurrentUser] = useState({ name: '', about: '', avatar: '' });
	const [cards, setCards] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isInfoTooltipOpen, setInfoTooltipOpen] = useState(false);
	const [isSuccess, setSucces] = useState(false); 

	// API изначальных данных юзера и карточек
	useEffect(() => {
		if(!isLoggedIn) {
			return undefined;
		} else {
        api.getUserInfoApi()
        .then((user) => {
			setCurrentUser(user)
        })
        .catch((err) => {
            console.log(err);
        });

		api.getInitialCards()
        .then((res) => {
            setCards(res);
        })
        .catch((err) => {
            console.log(err);
        });
	}
	}, [isLoggedIn]);

	//Лайк карточек
	function handleCardLike(card) {
		const isLiked = card.likes.some(i => i._id === currentUser._id);
		
		api.changeLikeCardStatus(card._id, isLiked)
		.then((newCard) => {
			setCards((state) => state.map((c) => c._id === card._id ? newCard : c));
		})
		.catch((err) => {
            console.log(err);
        });
	} 

	//Удаление карточки
	function handleCardDelete(card) {
		api.deleteCardApi(card._id)
        .then(() => {
			setCards((state) => state.filter((el) => el._id !== card._id));
			closeAllPopups();
		  })
		  .catch((err) => {
			console.error(err);
		  });
	}

	//Обновление данных юзера
	function handleUpdateUser(data) {
		api
		  .editUserInfo(data)
		  .then((newData) => {
			setCurrentUser(newData);
			closeAllPopups();
		  })
		  .catch((err) => {
			console.error(err);
		  });
	}

	//Обновление данных аватара
	function handleUpdateAvatar(data) {
		api
		  .changeAvatar(data)
		  .then((newData) => {
			setCurrentUser(newData);
			closeAllPopups();
		  })
		  .catch((err) => {
			console.error(err);
		  });
	}

	//Добавление новой карточки
	function handleAddPlaceSubmit(name, link) {
		api
		.createNewCard(name, link)
		.then((newCard) => {
		  setCards([newCard, ...cards]);
		  closeAllPopups();
		})
		.catch((err) => {
		  console.error(err);
		});
	}

	//Попапы открытие и закрытие
    function handleEditAvatarClick() {
        setIsEditAvatarPopupOpen(true)
    }

    function handleEditProfileClick() {
        setIsEditProfilePopupOpen(true)
    }

    function handleAddPlaceClick() {
        setIsAddPlacePopupOpen(true)
    }

    function handleCardClick(card) {
        setIsImagePopupOpen(true)
        setSelectedCard(card)
    }

	function closeAllPopups() {
		setIsEditProfilePopupOpen(false)
		setIsAddPlacePopupOpen(false)
		setIsEditAvatarPopupOpen(false)
		setIsImagePopupOpen(false)
		setInfoTooltipOpen(false)
	}

	//Регистрация
	function registerUser({ email, password }) {
		apiAuth
		.register(email, password)
		.then(({token}) => {
			localStorage.setItem("jwt", token);
			setToken(token);
			setSucces(true);
			navigate('/sign-in', { replace: true });
		})
		.catch((err) => {
			console.error(err);
			setSucces(false);
		})
		.finally(() => {
			setIsLoading(false);
			setInfoTooltipOpen(true);
		});
	}

	useEffect(() => {
		if (!token) {
			setIsLoading(false);
			return;
		}
	}, [token])

	useEffect(() => {
		if (localStorage.getItem("jwt")) {
			const jwt = localStorage.getItem("jwt");
			if (jwt) {
				apiAuth.checkToken(jwt)
				.then((user) => {
					setUserData(user);
					setIsLoggedIn(true);
					navigate('/');
				})
				.catch((err) => {
					console.error(err);
				})
				.finally(() => {
					setIsLoading(false);
				});
			} 
		}
	}, []);

	//Логин
	function loginUser({ email, password }) {
		apiAuth
		.login(email, password)
		.then((data) => {
			if (data.token) {
				setUserData(data.user);
				setIsLoggedIn(true);
				localStorage.setItem("jwt", data.token);
				navigate("/");
			}
		  })
		.catch((err) => {
			console.error(err);
			setSucces(false);
			setInfoTooltipOpen(true);
		})
		.finally(() => {
			setIsLoading(false);
		});
	}

	//Выход

	function logOut() {
		localStorage.removeItem("jwt");
		setIsLoggedIn(false);
		setToken("");
		setUserData({ _id: "", email: "" });
		navigate('/sign-in', { replace: true });
	}

	//Загрузка данных
	if (isLoading) {
		return null;
	}

	return (
		<CurrentUserContext.Provider value={currentUser}>
			<div className="page">
				<Header>
					<NavBar 
					userData={userData}
					loggedOut={logOut}
					loggedIn={isLoggedIn}
					/>
				</Header>
				<Routes>
					<Route path="*" element={isLoggedIn ? <Navigate to="/" /> : <Navigate to="/sign-in" />} />
					<Route path='/' element={<ProtectedRoute element={Main}
					cards={cards}
					onEditProfile={handleEditProfileClick}
					onAddPlace={handleAddPlaceClick}
					onEditAvatar={handleEditAvatarClick}
					onCardClick={handleCardClick}
					onCardLike={handleCardLike}
					onCardDelete={handleCardDelete}
					loggedIn={isLoggedIn}
					/>
					} />
					<Route path='/sign-up' element={<Register registerUser={registerUser} />} />
					<Route path='/sign-in' element={<Login loginUser={loginUser} />} />
				</Routes>
				<Footer />

				{/* Попап редактирования профиля */}
				<EditProfilePopup isOpen={isEditProfilePopupOpen} onClose={closeAllPopups} onUpdateUser={handleUpdateUser} />

				{/* Попап добавления карточки */}
				<AddPlacePopup isOpen={isAddPlacePopupOpen} onClose={closeAllPopups} onAddCard={handleAddPlaceSubmit}/>

				{/* Попап обновления аватара */}
				<EditAvatarPopup isOpen={isEditAvatarPopupOpen} onClose={closeAllPopups} onUpdateAvatar={handleUpdateAvatar} />

				{/*Попап большой картинки*/}
				<ImagePopup
				card={selectedCard}
				isOpen={isImagePopupOpen}
				onClose={closeAllPopups}
				/>

				{/*Попап успеха/ошибки регистрации и логина*/}
				<InfoTooltip
				name={'info-outcome'}
				isOpen={isInfoTooltipOpen}
				onClose={closeAllPopups}
				isSuccess={isSuccess} />
			</div>
		</CurrentUserContext.Provider>
  );
}

export default App;
