// タイプライター風のテキスト表示と削除を行う
function typeWriterWithMistake(elementId, speed) {
    let i = 0;
    const element = document.getElementById(elementId);

    // 各段階のテキスト
    const text1 = "PLANETARY B LAND"; // 間違って入力する部分
    const text2 = "PLANETARY BRAND ARCHITECT"; // 正しい最終的なテキスト

    function type() {
        if (i < text1.length) {
            // 「PLANETARY B LAND」をタイプする
            element.innerHTML = text1.substring(0, i + 1) + '<span class="cursor">_</span>';
            i++;
            setTimeout(type, speed);
        } else if (i === text1.length) {
            // 少し待ってから「LAND」を削除開始
            setTimeout(deleteMistake, 1000);
        }
    }

    function deleteMistake() {
        if (i > "PLANETARY B ".length) {
            // 「LAND」を削除する
            element.innerHTML = text1.substring(0, i - 1) + '<span class="cursor">_</span>';
            i--;
            setTimeout(deleteMistake, speed);
        } else {
            // 削除が終わったら正しいテキストの入力を再開
            i = "PLANETARY B".length; // 次は「BRAND ARCHITECT」に進む
            setTimeout(typeCorrect, speed);
        }
    }

    function typeCorrect() {
        if (i < text2.length) {
            // 正しいテキストをタイプする
            element.innerHTML = text2.substring(0, i + 1) + '<span class="cursor">_</span>';
            i++;
            setTimeout(typeCorrect, speed);
        } else {
            // タイピングが完了したら5秒後に削除を開始
            setTimeout(deleteText, 5000);
        }
    }

    function deleteText() {
        element.innerHTML = text2.substring(0, i) + '<span class="cursor">_</span>';
        if (i > 0) {
            i--;
            setTimeout(deleteText, speed);
        } else {
            // 削除が完了したら再度タイピングを開始
            i = 0; // 最初に戻る
            setTimeout(type, 1000);
        }
    }

    type();
}

// タイプライター効果を開始
typeWriterWithMistake("overlayText", 100); // 100msごとに一文字表示、削除

// シーン、カメラ、レンダラーの設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 600; // カメラ位置をユーザーの好みに合わせて調整

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xBEBEBE); // 背景色を明るいグレーに設定
document.body.appendChild(renderer.domElement);

// パーティクルジオメトリの設定
let geometry = new THREE.BufferGeometry();

// SETTINGSオブジェクトの設定
const SETTINGS = {
    radius: 300,    // 立方体、球体、および楕円体の基本半径を大きくしてキャンバスいっぱいに使用
    amount: 20000   // 星の数を増やして密度を向上
};

// 状態を保持する変数
let transitioningTo = 'mountainRange'; // 最初は山脈への変化から開始

// ノイズ関数を使って山脈を作成
function generateMountainRange(x, radius) {
    const frequency = 0.02; // 頻度を設定して山の数を調整
    const amplitude = 150;  // 山の高さを調整
    const baseHeight = Math.pow(Math.abs(x) / radius, 2) * -100; // 両端を下に向けるための高さ調整
    return Math.sin(x * frequency) * amplitude + Math.cos(x * frequency * 1.5) * amplitude * 0.5 + baseHeight;
}

// 星の位置を更新する関数（立方体内にランダムに配置）
function initializeStars(radius, amount) {
    radius = radius || SETTINGS.radius;
    amount = amount || SETTINGS.amount;

    const diameter = radius * 2;
    const vertices = [];
    const cubeTargets = [];
    const sphereTargets = [];
    const ellipsoidTargets = [];
    const mountainRangeTargets = [];

    for (let i = 0; i < amount; i++) {
        // 立方体内のランダムな位置
        const x = (Math.random() * diameter) - radius;
        const y = (Math.random() * diameter) - radius;
        const z = (Math.random() * diameter) - radius;
        vertices.push(x, y, z);
        cubeTargets.push(x, y, z);

        // 球体の表面上の目標位置を計算
        const theta = Math.random() * Math.PI * 2; // ランダムな角度
        const phi = Math.acos((Math.random() * 2) - 1); // ランダムな傾き
        const r = radius;

        const sphericalX = r * Math.sin(phi) * Math.cos(theta);
        const sphericalY = r * Math.sin(phi) * Math.sin(theta);
        const sphericalZ = r * Math.cos(phi);
        sphereTargets.push(sphericalX, sphericalY, sphericalZ);

        // 楕円体の表面上の目標位置を計算
        const scaleX = 1.0; // x方向のスケール（そのまま）
        const scaleY = 0.5; // y方向のスケール（縮める）
        const scaleZ = 1.5; // z方向のスケール（伸ばす）

        const ellipsoidX = r * Math.sin(phi) * Math.cos(theta) * scaleX;
        const ellipsoidY = r * Math.sin(phi) * Math.sin(theta) * scaleY;
        const ellipsoidZ = r * Math.cos(phi) * scaleZ;
        ellipsoidTargets.push(ellipsoidX, ellipsoidY, ellipsoidZ);

        // 山脈の形状の目標位置を計算（X軸に沿って連続する山々を作成）
        const mountainRangeX = (Math.random() * diameter) - radius;
        const mountainRangeY = generateMountainRange(mountainRangeX, radius); // ノイズ関数で山脈のY値を生成
        const mountainRangeZ = 0; // Z軸は常に0に固定
        mountainRangeTargets.push(mountainRangeX, mountainRangeY, mountainRangeZ);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('cubeTargetPosition', new THREE.Float32BufferAttribute(cubeTargets, 3));
    geometry.setAttribute('sphereTargetPosition', new THREE.Float32BufferAttribute(sphereTargets, 3));
    geometry.setAttribute('ellipsoidTargetPosition', new THREE.Float32BufferAttribute(ellipsoidTargets, 3));
    geometry.setAttribute('mountainRangeTargetPosition', new THREE.Float32BufferAttribute(mountainRangeTargets, 3));
}

// 初回は立方体の位置を生成
initializeStars(SETTINGS.radius, SETTINGS.amount);

// シンプルなマテリアルを使用
const material = new THREE.PointsMaterial({
    color: 0x000000, // パーティクルの色を黒に設定
    size: 1.5,       // パーティクルのサイズを大きくして視認性を向上
    transparent: true,
    opacity: 1.0,
});

// パーティクルメッシュを作成しシーンに追加
const stars = new THREE.Points(geometry, material);
scene.add(stars);

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    // 頂点位置の更新
    const positions = geometry.attributes.position.array;
    const cubeTargets = geometry.attributes.cubeTargetPosition.array;
    const sphereTargets = geometry.attributes.sphereTargetPosition.array;
    const ellipsoidTargets = geometry.attributes.ellipsoidTargetPosition.array;
    const mountainRangeTargets = geometry.attributes.mountainRangeTargetPosition.array;

    // 目標の位置にゆっくりと移動する
    for (let i = 0; i < positions.length; i++) {
        if (transitioningTo === 'sphere') {
            positions[i] += (sphereTargets[i] - positions[i]) * 0.01; // 球体の目標位置に近づける
        } else if (transitioningTo === 'ellipsoid') {
            positions[i] += (ellipsoidTargets[i] - positions[i]) * 0.01; // 楕円体の目標位置に近づける
        } else if (transitioningTo === 'cube') {
            positions[i] += (cubeTargets[i] - positions[i]) * 0.01; // 立方体の目標位置に近づける
        } else if (transitioningTo === 'mountainRange') {
            positions[i] += (mountainRangeTargets[i] - positions[i]) * 0.01; // 山脈の目標位置に近づける
        }
    }

    geometry.attributes.position.needsUpdate = true; // ジオメトリの更新をThree.jsに知らせる

    // 変化が完了したら次の形状へ
    if (transitioningTo === 'sphere' && checkIfTransitionComplete(positions, sphereTargets)) {
        transitioningTo = 'ellipsoid'; // 球体への変化が完了したら次は楕円体へ
    } else if (transitioningTo === 'ellipsoid' && checkIfTransitionComplete(positions, ellipsoidTargets)) {
        transitioningTo = 'cube'; // 楕円体への変化が完了したら次は立方体へ
    } else if (transitioningTo === 'cube' && checkIfTransitionComplete(positions, cubeTargets)) {
        transitioningTo = 'mountainRange'; // 立方体への変化が完了したら次は山脈へ
    } else if (transitioningTo === 'mountainRange' && checkIfTransitionComplete(positions, mountainRangeTargets)) {
        transitioningTo = 'sphere'; // 山脈への変化が完了したら次は球体へ
    }

    // 星をゆっくり回転させる（山脈のときは回転させない）
    if (transitioningTo !== 'mountainRange') {
        stars.rotation.y += 0.005;
        stars.rotation.x += 0.001;
    }

    renderer.render(scene, camera);
}

// すべての頂点が目標位置に近いかどうかをチェックする関数
function checkIfTransitionComplete(currentPositions, targetPositions) {
    const threshold = 0.1; // 許容する誤差の範囲
    for (let i = 0; i < currentPositions.length; i++) {
        if (Math.abs(currentPositions[i] - targetPositions[i]) > threshold) {
            return false; // どれかが目標位置に十分近くないならまだ変化中
        }
    }
    return true; // 全ての頂点が目標位置に十分近い
}

animate();

// ウィンドウサイズ変更に対応
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
