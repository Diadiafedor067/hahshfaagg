import React, { useState, useEffect } from "react";
import { db, doc, getDoc, setDoc, updateDoc } from "./firebase"; 
import sha256 from "crypto-js/sha256";
import './HomePage.css';
import { Link } from 'react-router-dom';

const roundToNearestDecimal = (num, decimalPlaces = 1) => {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(num * factor) / factor;
};

const HomePage = () => {
  const [blocksMined, setBlocksMined] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [lastBlocks, setLastBlocks] = useState([]);
  const [miningAttempts, setMiningAttempts] = useState(0);
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);

  const MAX_BLOCKS = 1000000;

  useEffect(() => {
    const telegram = window.Telegram.WebApp;
    telegram.ready();

    const tgUser = telegram.initDataUnsafe?.user;

    if (tgUser && tgUser.id) {
      setUser(tgUser);
      fetchBalance(tgUser.id);
    } else {
      console.error("User data is not available");
    }
  }, []);

  const fetchBalance = async (userId) => {
    const userDocRef = doc(db, "hash", userId.toString());
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      setBalance(userDocSnap.data().balance || 0);
    } else {
      await setDoc(userDocRef, { balance: 0 });
      setBalance(0);
    }
  };

  const updateBalance = async (newBalance) => {
    if (user) {
      const userDocRef = doc(db, "hash", user.id.toString());
      await updateDoc(userDocRef, { balance: newBalance });
      setBalance(newBalance);
    }
  };

  const mineBlock = async () => {
    try {
      setIsMining(true);

      let nonce = 0;
      let blockHash = "";
      const target = "0".repeat(difficulty);
      const blockData = `User-mined block by ${user?.first_name || "Unknown"}`;

      let totalReward = 0; 

      while (true) {
        nonce++;
        setMiningAttempts(prevAttempts => prevAttempts + 1); 

        const timestamp = new Date().toISOString();
        const previousHash = "0";
        blockHash = calculateHash(nonce, blockData, timestamp, previousHash);

        if (blockHash.startsWith(target)) {
          totalReward = roundToNearestDecimal(miningAttempts / 100000 * 0.5, 1);

          const blockInfo = {
            blockId: blocksMined + 1,  
            userId: user?.id || "unknown",  
            blockHash,  
            difficulty, 
            reward: totalReward, 
            timestamp, 
            blockData,  
          };

          const response = await fetch("https://serv.sp1project.ru/mine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(blockInfo),
          });

          if (!response.ok) {
            throw new Error("Error while adding block to server.");
          }

          const newBalance = balance + totalReward;
          await updateBalance(newBalance);
          break;
        }

        if (nonce % 100 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));  
        }
      }
    } catch (error) {
      console.error("Mining error:", error);
    } finally {
      setIsMining(false);
    }
  };

  const calculateHash = (nonce, blockData, timestamp, previousHash) => {
    return sha256(nonce + blockData + timestamp + previousHash).toString();
  };

  useEffect(() => {
    fetchBlocksCount();
    fetchDifficulty();
    fetchLastBlocks();

    const intervalId = setInterval(() => {
      fetchBlocksCount();
      fetchDifficulty();
      fetchLastBlocks();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchBlocksCount = async () => {
    try {
      const response = await fetch("https://serv.sp1project.ru/blocks-count");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setBlocksMined(data.blockCount || 0);
    } catch (error) {
      console.error("Error fetching block data:", error);
    }
  };

  const fetchDifficulty = async () => {
    try {
      const response = await fetch("https://serv.sp1project.ru/difficulty");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setDifficulty(data.difficulty || 0);
    } catch (error) {
      console.error("Error fetching difficulty:", error);
    }
  };

  const fetchLastBlocks = async () => {
    try {
      const response = await fetch("https://serv.sp1project.ru/latest-blocks");
      const data = await response.json();

      const sortedBlocks = data.latestBlocks
        ? data.latestBlocks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        : [];

      setLastBlocks(sortedBlocks);
    } catch (error) {
      console.error("Error fetching latest blocks:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <>
        <div className="homepage">
        
          <div data-v-aa8b41f1="" class="w-full flex flex-col items-center score_block gap-2 relative">
          <div data-v-aa8b41f1="" class="floating-text-container">
          <h4 data-v-aa8b41f1="" class="text-md font-bold text-white mb-3 mt-6">Мой профиль</h4>
          <div data-v-f04d4ce5="" class="block">
          <div data-v-f04d4ce5="" class="block-content"><div data-v-f04d4ce5="" class="block-content__item">
            <h2 data-v-f04d4ce5="" class="block-content__item__text">Баланс</h2><h3 data-v-f04d4ce5="" class="block-content__item__data">{balance}</h3></div>
          <div data-v-f04d4ce5="" class="block-content__item"><h2 data-v-f04d4ce5="" class="block-content__item__text">Энергия</h2>
          <h3 data-v-f04d4ce5="" class="block-content__item__data">85</h3></div></div></div>
         
          <h4 data-v-aa8b41f1="" class="text-md font-bold text-white mb-3 mt-6">Информация</h4>
          <div data-v-f04d4ce5="" class="block">
          <div data-v-f04d4ce5="" class="block-content"><div data-v-f04d4ce5="" class="block-content__item">
            <h2 data-v-f04d4ce5="" class="block-content__item__text">Блок</h2><h3 data-v-f04d4ce5="" class="block-content__item__data block-content__item__data--status">
              <span data-v-f04d4ce5="">#{blocksMined}</span></h3></div><div data-v-f04d4ce5="" class="block-content__item"><h2 data-v-f04d4ce5="" class="block-content__item__text">Сложность</h2>
              <h3 data-v-f04d4ce5="" class="block-content__item__data">{difficulty}</h3></div><div data-v-f04d4ce5="" class="block-content__item"><h2 data-v-f04d4ce5="" class="block-content__item__text">Награда</h2>
              <h3 data-v-f04d4ce5="" class="block-content__item__data">2000</h3></div>
          <div data-v-f04d4ce5="" class="block-content__item"><h2 data-v-f04d4ce5="" class="block-content__item__text">В сети</h2><h3 data-v-f04d4ce5="" class="block-content__item__data">2</h3></div></div></div>
          
          <h4 data-v-aa8b41f1="" class="text-md font-bold text-white mb-3 mt-6">Майнинг</h4>
          <div data-v-f04d4ce5="" class="block">
          <div data-v-f04d4ce5="" class="block-content"><div data-v-f04d4ce5="" class="block-content__item">
            <h2 data-v-f04d4ce5="" class="block-content__item__text">Статус</h2><h3 data-v-f04d4ce5="" class="block-content__item__data block-content__item__data--status">
              <span data-v-f04d4ce5="">Ожидание</span></h3></div><div data-v-f04d4ce5="" class="block-content__item"><h2 data-v-f04d4ce5="" class="block-content__item__text">Shares</h2>
              <h3 data-v-f04d4ce5="" class="block-content__item__data">0</h3></div><div data-v-f04d4ce5="" class="block-content__item"><h2 data-v-f04d4ce5="" class="block-content__item__text">Хэши</h2>
              <h3 data-v-f04d4ce5="" class="block-content__item__data">{miningAttempts}</h3></div>
          <div data-v-f04d4ce5="" class="block-content__item"><h2 data-v-f04d4ce5="" class="block-content__item__text">Доход</h2><h3 data-v-f04d4ce5="" class="block-content__item__data">{balance}</h3></div></div></div>
          <div className="info-container">
            {user && <p>User ID: {user.id}</p>}
          </div>
          <button
            className="start-button"
            onClick={mineBlock}
            disabled={isMining}
          >
            {isMining ? "→Стоп←" : "→Начать майнинг←"}
          </button>
          <div className="last-blocks">
            <h3>Последние блоки</h3>
            {lastBlocks.length > 0 ? (
              <ul>
                {lastBlocks.map((block, index) => (
                  <li key={index}>
                    <strong>Block {block.id}:</strong> {formatTimestamp(block.timestamp)}
                    <br />
                    <em>{block.hash}</em>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No blocks mined yet.</p>
            )}
          </div>
        </div>
        <div className="main-menu">   
        <ul className="main-menu-list">
          <li className="menu-item ">
          <Link className="menu-button active" to="/app" aria-current="page">
            <div className="menu-button-section">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#3592d1"><path d="M418-340q24 24 62 23.5t56-27.5l224-336-336 224q-27 18-28.5 55t22.5 61Zm62-460q59 0 113.5 16.5T696-734l-76 48q-33-17-68.5-25.5T480-720q-133 0-226.5 93.5T160-400q0 42 11.5 83t32.5 77h552q23-38 33.5-79t10.5-85q0-36-8.5-70T766-540l48-76q30 47 47.5 100T880-406q1 57-13 109t-41 99q-11 18-30 28t-40 10H204q-21 0-40-10t-30-28q-26-45-40-95.5T80-400q0-83 31.5-155.5t86-127Q252-737 325-768.5T480-800Zm7 313Z"/></svg>
              <span className="menu-span active">Майнинг</span>
            </div>
          </Link>
          </li>
          <li className="menu-item ">
            <Link className="menu-button" to="/frens">
              <div className="menu-button-section">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5D729F"><path d="M841-518v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Zm-272-42q27 0 41-18.5t11-41.5l-22-140h-78v148q0 21 14 36.5t34 15.5Zm-180 0q23 0 37.5-15.5T441-612v-148h-78l-22 140q-4 24 10.5 42t37.5 18Zm-178 0q18 0 31.5-13t16.5-33l22-154h-78l-40 134q-6 20 6.5 43t41.5 23Zm540 0q29 0 42-23t6-43l-42-134h-76l22 154q3 20 16.5 33t31.5 13ZM201-200h560v-282q-5 2-6.5 2H751q-27 0-47.5-9T663-518q-18 18-41 28t-49 10q-27 0-50.5-10T481-518q-17 18-39.5 28T393-480q-29 0-52.5-10T299-518q-21 21-41.5 29.5T211-480h-4.5q-2.5 0-5.5-2v282Zm560 0H201h560Z"/></svg>
                <span className="menu-span">бусты</span>
              </div>
            </Link>
          </li>
          
          <li className="menu-item ">
            <Link className="menu-button" to="/leaderboard">
              <div className="menu-button-section">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5D729F"><path d="m438-240 226-226-58-58-169 169-84-84-57 57 142 142ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>
                <span className="menu-span">Задания</span></div>
            </Link>
          </li>
          <Link className="menu-button" to="/leaderboard">
              <div className="menu-button-section">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5D729F"><path d="M480-160q75 0 127.5-52.5T660-340q0-75-52.5-127.5T480-520q-75 0-127.5 52.5T300-340q0 75 52.5 127.5T480-160ZM363-572q20-11 42.5-17.5T451-598L350-800H250l113 228Zm234 0 114-228H610l-85 170 19 38q14 4 27 8.5t26 11.5ZM256-208q-17-29-26.5-62.5T220-340q0-36 9.5-69.5T256-472q-42 14-69 49.5T160-340q0 47 27 82.5t69 49.5Zm448 0q42-14 69-49.5t27-82.5q0-47-27-82.5T704-472q17 29 26.5 62.5T740-340q0 36-9.5 69.5T704-208ZM480-80q-40 0-76.5-11.5T336-123q-9 2-18 2.5t-19 .5q-91 0-155-64T80-339q0-87 58-149t143-69L120-880h280l80 160 80-160h280L680-559q85 8 142.5 70T880-340q0 92-64 156t-156 64q-9 0-18.5-.5T623-123q-31 20-67 31.5T480-80Zm0-260ZM363-572 250-800l113 228Zm234 0 114-228-114 228ZM406-230l28-91-74-53h91l29-96 29 96h91l-74 53 28 91-74-56-74 56Z"/></svg>
                <span className="menu-span">лидеры</span>
              </div>
            </Link>
          <li className="menu-item disabled">
            <div className="menu-button" slot="pointer-events: none; cursor: not-allowed; opacity: 0.4;">
                <div className="menu-button-section"><svg xmlns="http://www.w3.org/2000/svg" width="23" height="19" fill="none"><path fill="#5D729F" d="M15.045 9.5a1.681 1.681 0 1 1 3.362 0 1.681 1.681 0 0 1-3.362 0"></path><path fill="#5D729F" fill-rule="evenodd" d="M20.583 3.531a5.28 5.28 0 0 0-4.304-3.18l-.731-.078A49.8 49.8 0 0 0 4.453.35L3.97.407a4.125 4.125 0 0 0-3.6 3.551 42 42 0 0 0 0 11.084 4.125 4.125 0 0 0 3.6 3.55l.484.058a49.8 49.8 0 0 0 11.095.077l.73-.077a5.28 5.28 0 0 0 4.305-3.181 3.1 3.1 0 0 0 2.199-2.604 29 29 0 0 0 0-6.73 3.1 3.1 0 0 0-2.2-2.604m-5.21-1.586a48 48 0 0 0-10.72.074l-.485.057A2.444 2.444 0 0 0 2.034 4.18a40.2 40.2 0 0 0 0 10.64 2.444 2.444 0 0 0 2.134 2.104l.484.057c3.56.424 7.155.45 10.72.074l.73-.077c.954-.1 1.797-.57 2.382-1.267-1.69.098-3.403.054-5.073-.133a3.11 3.11 0 0 1-2.74-2.713 29 29 0 0 1 0-6.73 3.11 3.11 0 0 1 2.74-2.713c1.67-.187 3.383-.231 5.073-.133a3.6 3.6 0 0 0-2.381-1.267zm3.905 3.089.002.013.007.043.223-.034.345.036a1.426 1.426 0 0 1 1.257 1.239 27.3 27.3 0 0 1 0 6.338 1.426 1.426 0 0 1-1.257 1.239l-.345.036-.223-.034-.007.043-.002.013c-1.881.17-3.81.15-5.68-.058a1.426 1.426 0 0 1-1.258-1.239 27.3 27.3 0 0 1 0-6.338c.075-.645.6-1.165 1.258-1.239 1.87-.209 3.799-.228 5.68-.058" clip-rule="evenodd"></path>
              </svg>
                <span className="menu-span">Кошелек</span></div>
            </div>
          </li>
        </ul>
      </div>
        </div>
        </div>
    </>
  );
};

export default HomePage;