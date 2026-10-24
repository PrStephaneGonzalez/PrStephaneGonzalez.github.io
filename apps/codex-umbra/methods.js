/* Le Grimoire, partie « Méthode » : pour chaque Loi et chaque palier, la marche à suivre
   pas à pas, les pièges et la façon de saisir la réponse. Les exemples résolus sont,
   eux, tirés en direct des générateurs (app.js), pour coller exactement aux épreuves. */
'use strict';
(function () {
  const M = String.raw;
  const ol = (...steps) => '<ol class="meth">' + steps.map((s) => '<li>' + s + '</li>').join('') + '</ol>';
  const pit = (s) => '<p class="pit"><b>Piège</b> — ' + s + '</p>';
  const tip = (s) => '<p class="tip"><b>Saisie</b> — ' + s + '</p>';
  const add = (id, arr) => (CU.SKILLS[id].methods = arr);

  /* ======================= VECTEURS ======================= */
  add('v1', [
    ol(
      M`Repère l’<b>origine</b> de la flèche (le point rond) et sa <b>pointe</b>.`,
      M`Compte les carreaux <b>horizontalement</b>, de l’origine jusqu’à l’aplomb de la pointe : vers la droite, $x$ est positif ; vers la gauche, négatif.`,
      M`Compte les carreaux <b>verticalement</b> : vers le haut, $y$ est positif ; vers le bas, négatif.`,
      M`Écris $\vec u\begin{pmatrix}x\\y\end{pmatrix}$ : le déplacement horizontal en haut, le vertical en bas.`,
    ) +
      pit(M`on compte depuis l’origine <b>de la flèche</b>, pas depuis l’origine du repère. Une flèche horizontale a $y=0$, une flèche verticale $x=0$.`),
    ol(
      M`Lis les coordonnées du point de départ $A(x_A\,;\,y_A)$.`,
      M`Ajoute celles du vecteur $\vec u\begin{pmatrix}a\\b\end{pmatrix}$ : l’image est $A'(x_A+a\,;\,y_A+b)$.`,
      M`Sur la grille : depuis $A$, avance de $a$ carreaux horizontalement puis de $b$ verticalement, et touche le point d’arrivée.`,
    ) + pit(M`le signe donne le sens : $a=-3$ signifie trois carreaux <b>vers la gauche</b>.`),
    `<p>Trois situations, une seule formule $\\overrightarrow{AB}\\begin{pmatrix}x_B-x_A\\\\y_B-y_A\\end{pmatrix}$ :</p>` +
      ol(
        M`On connaît $A$ et $B$ : « arrivée moins départ », coordonnée par coordonnée.`,
        M`On connaît $A$ et $\overrightarrow{AB}\begin{pmatrix}a\\b\end{pmatrix}$ : on <b>ajoute</b>, $x_B=x_A+a$ et $y_B=y_A+b$.`,
        M`On connaît $B$ et $\overrightarrow{AB}$ : on <b>retranche</b>, $x_A=x_B-a$ et $y_A=y_B-b$.`,
      ) +
      pit(M`soustraire un négatif revient à ajouter : écris la parenthèse avant de calculer, $5-(-12)=5+12=17$.`),
  ]);
  add('v2', [
    ol(
      M`Pars du point $O$.`,
      M`Applique $\vec u$ : compte ses carreaux sur la figure et reproduis le même déplacement depuis $O$.`,
      M`Depuis le point atteint, applique $\vec v$ de la même façon.`,
      M`Le point final est $M$. Contrôle : les coordonnées de $\overrightarrow{OM}$ sont les sommes de celles de $\vec u$ et de $\vec v$.`,
    ) + pit(M`$\vec u+\vec v$ n’est pas la flèche qui relie les deux pointes : on met les flèches <b>bout à bout</b>.`),
    ol(
      M`En coordonnées : $\begin{pmatrix}x\\y\end{pmatrix}+\begin{pmatrix}x'\\y'\end{pmatrix}=\begin{pmatrix}x+x'\\y+y'\end{pmatrix}$, et $\vec u-\vec v=\begin{pmatrix}x-x'\\y-y'\end{pmatrix}$.`,
      M`Relation de Chasles : $\overrightarrow{XY}+\overrightarrow{YZ}=\overrightarrow{XZ}$. La lettre du milieu doit être la même (l’arrivée de la première flèche est le départ de la seconde) et elle « disparaît ».`,
      M`Si les flèches ne s’enchaînent pas dans l’ordre écrit, échange-les : $\overrightarrow{BD}+\overrightarrow{DA}=\overrightarrow{DA}+\overrightarrow{BD}$.`,
    ) + pit(M`$\overrightarrow{AB}+\overrightarrow{CB}$ ne s’enchaîne pas : $B$ est l’arrivée des deux. Il faut d’abord retourner une flèche.`),
    ol(
      M`Remplace chaque flèche soustraite par la flèche retournée : $-\overrightarrow{XY}=\overrightarrow{YX}$.`,
      M`Cherche une flèche qui part là où une autre arrive, et colle-les par Chasles.`,
      M`Recommence jusqu’à ce qu’il ne reste qu’une flèche. Si l’on revient au point de départ, le résultat est $\vec 0$.`,
      M`Contrôle : le départ du résultat est le seul point qui n’est l’arrivée d’aucune flèche, et son arrivée le seul point qui n’est le départ d’aucune.`,
    ) + pit(M`l’ordre d’écriture ne compte pas (l’addition est commutative) : réordonne librement, mais ne retourne une flèche que si elle est précédée d’un signe moins.`),
  ]);
  add('v3', [
    ol(
      M`Calcule chaque produit : $k\vec u\begin{pmatrix}kx\\ky\end{pmatrix}$. Le terme $-\vec u$ correspond à $k=-1$.`,
      M`Additionne coordonnée par coordonnée : $a\vec u+b\vec v\begin{pmatrix}ax_u+bx_v\\ay_u+by_v\end{pmatrix}$.`,
    ) + pit(M`un signe moins devant un terme s’applique aux <b>deux</b> coordonnées : $-3\vec v\begin{pmatrix}-2\\-1\end{pmatrix}=\begin{pmatrix}6\\3\end{pmatrix}$.`),
    ol(
      M`Calcule le déplacement total nécessaire, $\overrightarrow{SR}$ (arrivée moins départ).`,
      M`Cherche des entiers $a$ et $b$ tels que $a\vec u+b\vec v=\overrightarrow{SR}$, par essais ou avec un système. Il faudra $|a|+|b|$ sauts.`,
      M`Choisis l’ordre des sauts pour contourner les gouffres : l’arrivée ne dépend pas de l’ordre, le chemin si.`,
    ) + pit(M`un saut $-\vec u$ compte pour un saut. Si tu tombes dans un gouffre, change l’ordre, pas les nombres $a$ et $b$.`),
    ol(
      M`Écris le système $\begin{cases}a\,x_u+b\,x_v=x_w\\ a\,y_u+b\,y_v=y_w\end{cases}$.`,
      M`Élimine une inconnue : multiplie les lignes pour avoir le même coefficient devant $a$, puis soustrais-les (ou exprime $a$ dans une ligne et remplace dans l’autre).`,
      M`Calcule l’inconnue restante, puis remplace pour obtenir l’autre.`,
      M`Vérifie en recalculant $a\vec u+b\vec v$.`,
    ) +
      pit(M`la solution est unique seulement si $x_uy_v-y_ux_v\neq0$. Les fractions sont normales ici.`) +
      tip(M`<code>1/2</code>, <code>-3/4</code>.`),
  ]);
  add('v4', [
    ol(M`Élève chaque coordonnée au carré (un carré est toujours positif : $(-9)^2=81$).`, M`Additionne les deux carrés.`, M`Prends la racine carrée. Si la somme est un carré parfait ($25$, $100$, $225$…), donne l’entier.`) +
      pit(M`$\sqrt{x^2+y^2}\neq x+y$ : $\sqrt{9+16}=5$, pas $7$.`),
    ol(
      M`Calcule les écarts $x_B-x_A$ et $y_B-y_A$.`,
      M`Élève-les au carré et additionne.`,
      M`Simplifie la racine : cherche le plus grand carré qui divise le nombre ($4, 9, 16, 25, 36, 49\dots$). $\sqrt{72}=\sqrt{36\times2}=6\sqrt2$. Si aucun carré ne divise, garde $\sqrt{73}$.`,
    ) +
      pit(M`on attend la <b>valeur exacte</b>, pas un arrondi décimal.`) +
      tip(M`<code>6√2</code> (bouton √) ou <code>sqrt(72)</code>.`),
    ol(
      M`Calcule les trois carrés $AB^2$, $AC^2$, $BC^2$, sans racine.`,
      M`Deux carrés égaux : le triangle est isocèle. Trois égaux : équilatéral (impossible sur la grille).`,
      M`Prends le plus grand carré. S’il est égal à la somme des deux autres, le triangle est rectangle (réciproque de Pythagore), avec l’angle droit au sommet opposé au plus grand côté. Sinon, il n’est pas rectangle (contraposée).`,
      M`Les deux propriétés peuvent coexister : un triangle peut être isocèle <b>et</b> rectangle.`,
    ) + pit(M`on compare le <b>plus grand</b> carré à la somme des deux autres, pas n’importe quel couple.`),
  ]);
  add('v5', [
    ol(M`$\det(\vec u,\vec v)=x\,y'-y\,x'$ : le haut de $\vec u$ fois le bas de $\vec v$, moins le bas de $\vec u$ fois le haut de $\vec v$.`, M`Écris les deux produits avec des parenthèses autour des négatifs, puis soustrais.`, M`Résultat nul : les vecteurs sont colinéaires ; non nul : ils ne le sont pas.`) +
      pit(M`l’ordre compte pour le signe : $\det(\vec v,\vec u)=-\det(\vec u,\vec v)$. Calcule bien $\det(\vec u,\vec v)$.`),
    ol(
      M`<b>Avec un paramètre</b> : écris le déterminant en fonction de $m$, puis résous $\det=0$.`,
      M`<b>Alignement</b> : calcule $\overrightarrow{AB}$ et $\overrightarrow{AC}$, puis leur déterminant. Nul : $A$, $B$, $C$ sont alignés ; non nul : ils ne le sont pas.`,
    ) + pit(M`prends deux vecteurs qui partent du même point ($\overrightarrow{AB}$ et $\overrightarrow{AC}$). Avec $\overrightarrow{AB}$ et $\overrightarrow{CD}$, tu testes un parallélisme, pas un alignement.`),
    ol(
      M`Écris le déterminant : s’il contient $m^2$, mets l’équation sous la forme $\dots=0$.`,
      M`Factorise (ou calcule $\Delta$), puis applique le produit nul : il peut y avoir deux valeurs.`,
      M`<b>Point inconnu</b> $C(x\,;\,y)$ : les coordonnées de $\overrightarrow{AC}$ contiennent l’inconnue ; $\det(\overrightarrow{AB},\overrightarrow{AC})=0$ est une équation du premier degré.`,
    ) + tip(M`plusieurs valeurs séparées par <code>;</code>, par exemple <code>5 ; -6</code>.`),
  ]);
  add('v6', [
    ol(M`Abscisse du milieu : la moyenne $\dfrac{x_A+x_B}2$.`, M`Ordonnée du milieu : la moyenne $\dfrac{y_A+y_B}2$.`) +
      pit(M`c’est une <b>moyenne</b> : on additionne, on ne soustrait pas.`) +
      tip(M`fraction acceptée : <code>1/2</code>.`),
    ol(
      M`Lis le déplacement $\overrightarrow{AB}$ (de $A$ vers $B$) sur la grille.`,
      M`Depuis $C$, fais le déplacement <b>opposé</b> ($\overrightarrow{BA}$) : tu arrives en $D$, car $\overrightarrow{DC}=\overrightarrow{AB}$.`,
      M`Contrôle : en parcourant $A\to B\to C\to D$, les côtés ne se croisent pas.`,
    ) + pit(M`$ABCD$ se lit dans l’ordre : $D$ est le sommet <b>opposé à $B$</b>.`),
    ol(
      M`Écris $\overrightarrow{AB}=\overrightarrow{DC}$ coordonnée par coordonnée : $x_B-x_A=x_C-x_D$.`,
      M`Isole $D$ : $x_D=x_A+x_C-x_B$ et $y_D=y_A+y_C-y_B$.`,
      M`Vérifie que $[AC]$ et $[BD]$ ont le même milieu.`,
    ) + pit(M`si l’ordre des lettres change ($ABDC$ au lieu de $ABCD$), les sommets opposés changent aussi, et la formule avec.`),
  ]);
  add('v7', [
    `<p>Les traductions à connaître par cœur :</p>` +
      ol(
        M`$I$ milieu de $[AB]$ $\iff\overrightarrow{AI}=\overrightarrow{IB}\iff\overrightarrow{IA}+\overrightarrow{IB}=\vec0$.`,
        M`$ABCD$ parallélogramme $\iff\overrightarrow{AB}=\overrightarrow{DC}$.`,
        M`$(AB)\parallel(CD)\iff\overrightarrow{AB}$ et $\overrightarrow{CD}$ colinéaires $\iff\det=0$.`,
        M`$A,B,C$ alignés $\iff\overrightarrow{AB}$ et $\overrightarrow{AC}$ colinéaires.`,
      ) +
      pit(M`une égalité de <b>longueurs</b> ($AB=CD$) ne dit rien de la direction ni du sens : elle ne donne jamais une égalité de vecteurs.`),
    ol(
      M`Commence par l’hypothèse, traduite en vecteurs (« Notons… », « Par hypothèse… »).`,
      M`Enchaîne des étapes qui n’utilisent que ce qui précède : Chasles pour insérer un point, puis une égalité connue pour remplacer.`,
      M`Termine par la conclusion, qui reprend exactement l’énoncé du théorème.`,
      M`Écarte l’intrus : une affirmation fausse en général, par exemple « les diagonales ont la même longueur » pour un parallélogramme quelconque.`,
    ),
    ol(
      M`Repère la conclusion, puis remonte : quelle égalité de vecteurs suffit à la prouver ?`,
      M`Vérifie chaque implication isolément : découle-t-elle vraiment des lignes précédentes ?`,
      M`Méfie-toi de l’ordre des lettres : c’est $\overrightarrow{IJ}=\overrightarrow{LK}$ (et non $\overrightarrow{KL}$) qui fait de $IJKL$ un parallélogramme.`,
    ) + pit(M`supposer la figure particulière (un carré, un rectangle) alors que l’énoncé dit « quelconque ».`),
  ]);

  /* ======================= CALCUL LITTÉRAL ======================= */
  add('f1', [
    ol(
      M`Distribue chaque facteur sur <b>chaque</b> terme de la parenthèse, avec son signe : $-4(-2x+1)=8x-4$.`,
      M`Regroupe les termes en $x$ entre eux, puis les nombres entre eux.`,
      M`Écris le résultat réduit, de la forme $ax+b$.`,
    ) +
      pit(M`un signe moins devant une parenthèse change le signe de <b>tous</b> ses termes.`) +
      tip(M`<code>33x-19</code>.`),
    ol(M`Chaque terme de la première parenthèse multiplie chaque terme de la seconde : quatre produits.`, M`Écris les quatre produits avec leurs signes : $x\times x=x^2$, $-4x\times1=-4x$…`, M`Réduis et range : $ax^2+bx+c$.`) +
      pit(M`$(x+1)(x+1)=x^2+x+x+1=x^2+2x+1$, et non $x^2+1$.`) +
      tip(M`<code>-4x^2-5x-1</code> (ou x²).`),
    ol(
      M`Développe chaque produit <b>séparément</b>, et garde le résultat entre parenthèses.`,
      M`Applique ensuite ce qui précède la parenthèse : un moins change chaque signe, un coefficient multiplie chaque terme.`,
      M`Réduis le tout.`,
      M`<b>Produit de trois facteurs</b> : développe deux d’entre eux, puis multiplie le résultat par le troisième.`,
    ) + pit(M`$-(x-3)^2=-(x^2-6x+9)=-x^2+6x-9$ : on développe le carré <b>avant</b> d’appliquer le moins.`),
  ]);
  add('f2', [
    ol(
      M`Identifie $a$ et $b$ dans $(a+b)^2$, $(a-b)^2$ ou $(a+b)(a-b)$.`,
      M`$(a\pm b)^2$ : le carré du premier, plus ou moins le <b>double produit</b> $2ab$, plus le carré du second.`,
      M`$(a+b)(a-b)=a^2-b^2$ : il n’y a pas de terme en $x$.`,
    ) + pit(M`$(x+3)^2\neq x^2+9$ : le double produit $2\times x\times3=6x$ ne disparaît jamais.`),
    ol(M`Quand $a=3x$, élève-le <b>entièrement</b> au carré : $(3x)^2=9x^2$.`, M`Double produit : $2\times3x\times7=42x$.`, M`Carré du second : $7^2=49$.`) + pit(M`$(3x)^2=9x^2$, pas $3x^2$.`),
    ol(
      M`<b>Calcul mental</b> : écris le nombre sous la forme $100\pm k$ (ou $10n\pm k$) et applique l’identité : $102^2=10000+400+4$.`,
      M`Pour un produit, cherche le nombre rond au milieu : $28\times32=(30-2)(30+2)=900-4$.`,
      M`<b>Identification</b> : le coefficient de $x^2$ vaut $a^2$, celui de $x$ vaut $2ab$, la constante vaut $b^2$. Trouve $a$, puis $b=\frac{\text{coef. de }x}{2a}$, et vérifie la constante.`,
    ),
  ]);
  add('f3', [
    ol(
      M`Cherche le plus grand nombre qui divise tous les coefficients (le PGCD).`,
      M`Écris chaque terme comme ce nombre fois quelque chose : $-15x+9=3\times(-5x)+3\times3$.`,
      M`Mets le facteur commun devant : $3(-5x+3)$. On peut aussi sortir $-3$ : $-3(5x-3)$, les deux sont justes.`,
      M`Contrôle en redéveloppant.`,
    ) + pit(M`factoriser <b>complètement</b> : $2(6x-9)$ est incomplet, puisque $6x-9=3(2x-3)$.`),
    ol(M`Le facteur commun est le PGCD des nombres, multiplié par la plus petite puissance de $x$ présente dans tous les termes.`, M`Divise chaque terme par ce facteur pour remplir la parenthèse : $-6x^2-4x=2x(-3x-2)$.`) +
      pit(M`un terme qui est égal au facteur commun laisse un $1$ : $3x^2+x=x(3x+1)$.`),
    ol(
      M`Repère la même parenthèse dans chaque terme. Un carré $(x-9)^2$ la contient deux fois : $(x-9)(x-9)$.`,
      M`Écris $(\text{facteur commun})\big[\dots\big]$, en recopiant dans le crochet ce qui reste de chaque terme, avec son signe.`,
      M`Réduis le crochet, en changeant les signes derrière un moins.`,
      M`Sors du crochet un éventuel nombre commun.`,
    ) + pit(M`$(x+6)(\dots)-(x+6)(-5x+4)$ donne le crochet $\big[\dots-(-5x+4)\big]=\big[\dots+5x-4\big]$.`),
  ]);
  add('f4', [
    ol(M`Repère deux carrés séparés par un <b>moins</b> : $x^2-100=x^2-10^2$.`, M`Écris $(a-b)(a+b)$ : $(x-10)(x+10)$.`) + pit(M`une somme de carrés comme $x^2+100$ ne se factorise pas avec les réels.`),
    ol(
      M`<b>Trois termes</b> : repère les deux carrés aux extrémités, $9x^2=(3x)^2$ et $4=2^2$.`,
      M`Vérifie que le terme du milieu vaut $\pm2ab$ : $2\times3x\times2=12x$.`,
      M`Son signe donne la forme : $-12x$ donne $(3x-2)^2$, $+12x$ donne $(3x+2)^2$.`,
      M`<b>Deux termes</b> avec coefficient : $9x^2-49=(3x)^2-7^2=(3x-7)(3x+7)$.`,
    ),
    ol(
      M`Sors d’abord un facteur numérique commun : $18x^2-24x+8=2(9x^2-12x+4)$.`,
      M`Reconnais ensuite l’identité dans la parenthèse : $2(3x-2)^2$.`,
      M`<b>Carrés de parenthèses</b> : $A^2-B^2=(A-B)(A+B)$. Écris les deux crochets en entier, puis réduis chacun.`,
    ) + pit(M`dans $A-B$, le moins porte sur toute la parenthèse $B$ : $\big[(2x-1)-(3x+5)\big]=\big[2x-1-3x-5\big]=\big[-x-6\big]$.`),
  ]);
  add('f5', [
    ol(M`Vérifie que l’équation est bien de la forme (produit) $=0$.`, M`Écris « facteur $=0$ » pour <b>chaque</b> facteur.`, M`Résous chaque équation du premier degré : $ax+b=0\iff x=-\dfrac ba$.`) +
      pit(M`$-3x+8=0\iff -3x=-8\iff x=\dfrac83$ : attention aux signes en divisant.`) +
      tip(M`les solutions séparées par <code>;</code>, par exemple <code>8/3 ; 3/4</code>.`),
    ol(
      M`Passe tout du même côté pour avoir $\dots=0$.`,
      M`Factorise : facteur commun, différence de deux carrés ou carré parfait.`,
      M`Applique le produit nul.`,
      M`Un carré parfait $(x+3)^2=0$ ne donne qu’<b>une</b> solution ; $x^2-9=0$ en donne deux, $3$ et $-3$.`,
    ) + pit(M`ne divise jamais les deux membres par $x$ : dans $x^2=6x$, tu perdrais la solution $x=0$.`),
    ol(
      M`$A^2=B^2$ : écris $A^2-B^2=0$, puis $(A-B)(A+B)=0$.`,
      M`$AB=AC$ : écris $AB-AC=0$, puis $A(B-C)=0$.`,
      M`Réduis chaque facteur, puis résous chaque équation du premier degré.`,
    ) + pit(M`$A^2=B^2$ ne donne pas seulement $A=B$ : il y a aussi $A=-B$.`),
  ]);
  add('f6', [
    ol(
      M`Teste la phrase sur des valeurs variées : un négatif, $0$, un nombre entre $0$ et $1$, un grand nombre.`,
      M`Si une seule valeur la rend fausse, la phrase est <b>fausse</b>, et cette valeur est ton contre-exemple.`,
      M`Si tout marche, la phrase est peut-être vraie, mais seule une preuve générale peut le garantir.`,
    ) + pit(M`les nombres entre $0$ et $1$ réservent des surprises : $\left(\frac12\right)^2=\frac14<\frac12$.`),
    ol(
      M`<b>Nomme</b> un objet quelconque : « Soit $n$ un entier ». Trois consécutifs : $n$, $n+1$, $n+2$. Un pair : $2k$ ; un impair : $2k+1$.`,
      M`<b>Calcule</b> : développe, réduis.`,
      M`<b>Reconnais</b> la forme voulue en factorisant : $3n+3=3(n+1)$.`,
      M`<b>Conclus</b> en nommant l’entier obtenu : « $n+1$ est un entier, donc $3(n+1)$ est un multiple de $3$ ».`,
    ) + pit(M`un exemple, même juste, n’est jamais une étape de preuve.`),
    ol(
      M`Mêmes étapes que pour une preuve directe, mais vérifie chaque ligne : est-elle vraie pour <b>tous</b> les cas ?`,
      M`Erreurs classiques : diviser par une quantité qui peut être nulle, utiliser la même lettre pour deux objets différents, confondre « divisible par $4$ » et « divisible par $8$ ».`,
      M`Pour la divisibilité par $8$ de $4k(k+1)$ : $k(k+1)$ est le produit de deux entiers consécutifs, donc pair.`,
    ),
  ]);

  /* ======================= SECOND DEGRÉ ======================= */
  add('q1', [
    ol(
      M`Prends la moitié du coefficient de $x$ : pour $x^2+14x$, c’est $7$.`,
      M`Écris $x^2+14x=(x+7)^2-7^2=(x+7)^2-49$ : on retire le carré qu’on a ajouté.`,
      M`Ajoute la constante : $x^2+14x+9=(x+7)^2-49+9=(x+7)^2-40$.`,
    ) +
      pit(M`le signe dans la parenthèse est celui du coefficient de $x$ : $x^2-8x=(x-4)^2-16$.`) +
      tip(M`<code>(x+7)^2-40</code>.`),
    ol(M`La moitié est une fraction : pour $5x$, c’est $\frac52$, et son carré vaut $\frac{25}4$.`, M`Écris $\left(x+\frac52\right)^2-\frac{25}4+c$.`, M`Mets $c$ sur $4$ pour additionner : $10=\frac{40}4$, donc $-\frac{25}4+\frac{40}4=\frac{15}4$.`) +
      tip(M`<code>(x+5/2)^2+15/4</code>.`),
    ol(
      M`Calcule $\alpha=-\dfrac{b}{2a}$.`,
      M`Calcule $\beta=f(\alpha)$ en remplaçant $x$ par $\alpha$ dans l’expression de départ.`,
      M`Écris $a(x-\alpha)^2+\beta$, en gardant le coefficient $a$ devant.`,
      M`Autre voie : mets $a$ en facteur dans les termes en $x$, puis complète le carré dans la parenthèse.`,
    ) + pit(M`si $a<0$, garde le moins devant : $-x^2+4x+6=-(x-2)^2+10$. Et $(x-\alpha)$ avec $\alpha=-3$ s’écrit $(x+3)$.`),
  ]);
  add('q2', [
    ol(
      M`Mets la fonction sous la forme $a(x-\alpha)^2+\beta$ et lis $\alpha$ <b>avec le signe opposé</b> de celui de la parenthèse : $(x-8)$ donne $\alpha=8$, $(x+3)$ donne $\alpha=-3$.`,
      M`$\beta$ est le nombre ajouté à la fin ; s’il n’y a pas de parenthèse ($2x^2+10$), $\alpha=0$.`,
      M`Si $a>0$, $\beta$ est un <b>minimum</b> ; si $a<0$, un <b>maximum</b>. Il est atteint en $x=\alpha$.`,
    ),
    ol(M`Repère $a$, $b$, $c$ dans $ax^2+bx+c$.`, M`Calcule $\alpha=-\dfrac b{2a}$.`, M`Calcule $\beta=f(\alpha)$ en remplaçant soigneusement, avec des parenthèses : $f\left(-\frac12\right)=\left(-\frac12\right)^2+\left(-\frac12\right)+4$.`) +
      pit(M`$-\dfrac b{2a}$ : le $2a$ est entièrement au dénominateur.`),
    ol(
      M`<b>Sommet connu</b> $(\alpha\,;\,\beta)$ : pars de $f(x)=a(x-\alpha)^2+\beta$.`,
      M`<b>Deux points au sol</b> (racines $x_1$, $x_2$) : pars de $f(x)=a(x-x_1)(x-x_2)$.`,
      M`Utilise le point supplémentaire pour trouver $a$ : remplace $x$ et $f(x)$, puis résous en $a$.`,
      M`<b>Optimisation</b> : exprime la grandeur en fonction de $x$ (aire $x(30-x)$, par exemple), mets-la sous forme canonique ; le maximum est $\beta$.`,
    ) + tip(M`<code>-1/5(x-5)^2+8</code> ou <code>-7/12(x-1)(x-9)</code>.`),
  ]);
  add('q3', [
    ol(
      M`Identifie $a$, $b$, $c$ <b>avec leurs signes</b>. Un terme absent vaut $0$.`,
      M`Calcule $\Delta=b^2-4ac$, en mettant $b$ entre parenthèses s’il est négatif : $(-3)^2=9$.`,
      M`Attention au signe de $-4ac$ : si $a$ et $c$ sont de signes contraires, il devient positif.`,
    ) + pit(M`$-3^2=-9$ mais $(-3)^2=9$ : $b^2$ est toujours positif ou nul.`),
    ol(
      M`Calcule $\Delta$.`,
      M`$\Delta>0$ : deux solutions $\dfrac{-b-\sqrt\Delta}{2a}$ et $\dfrac{-b+\sqrt\Delta}{2a}$.`,
      M`$\Delta=0$ : une seule solution, $-\dfrac b{2a}$.`,
      M`$\Delta<0$ : aucune solution réelle (bouton « aucune »).`,
      M`Simplifie : $\sqrt{81}=9$ ; sinon garde la racine, $\frac{3+\sqrt5}2$.`,
    ) + tip(M`<code>-4 ; 5</code> ou <code>(3+√5)/2 ; (3-√5)/2</code>.`),
    ol(
      M`Ramène l’équation à la forme $ax^2+bx+c=0$ : développe, passe tout à gauche, réduis.`,
      M`Applique ensuite la méthode du discriminant.`,
      M`<b>Équation bicarrée</b> $ax^4+bx^2+c=0$ : pose $X=x^2$, résous en $X$, puis cherche $x$ tel que $x^2=X$. Il n’y a de solutions que si $X\geqslant0$, et alors deux, $\pm\sqrt X$ (une seule si $X=0$).`,
    ) + pit(M`on ne calcule $\Delta$ que sur la forme $\dots=0$, jamais avant d’avoir tout passé du même côté.`),
  ]);
  add('q4', [
    ol(
      M`Trouve les racines $x_1<x_2$ (forme factorisée : elles se lisent directement).`,
      M`Repère le signe de $a$.`,
      M`Le trinôme a le signe de $a$ à l’<b>extérieur</b> des racines, le signe opposé <b>entre</b> elles, et il est nul aux racines.`,
      M`Inégalité stricte ($<$, $>$) : crochets ouverts en $x_1$, $x_2$ ; large ($\leqslant$, $\geqslant$) : crochets fermés.`,
    ) + pit(M`$\pm\infty$ a toujours un crochet ouvert.`),
    ol(M`Calcule $\Delta$ et les racines.`, M`Applique la règle du signe : signe de $a$ à l’extérieur des racines, signe opposé entre elles.`, M`Écris l’ensemble des solutions, avec des réunions $\cup$ si nécessaire.`),
    ol(
      M`$\Delta=0$ : $f(x)=a(x-x_0)^2$ a partout le signe de $a$ et ne s’annule qu’en $x_0$. Exemple : $>0$ pour $a>0$ donne $\mathbb R\setminus\{x_0\}$.`,
      M`$\Delta<0$ : $f$ a le signe de $a$ sur tout $\mathbb R$. L’ensemble des solutions est $\mathbb R$ ou $\varnothing$.`,
    ) + pit(M`$(x-3)^2\geqslant0$ est vrai pour tout réel ; $(x-3)^2>0$ exclut $3$.`),
  ]);
  add('q5', [
    ol(M`Utilise le produit des racines : $x_1x_2=\dfrac ca$.`, M`Divise par la racine connue : $x_2=\dfrac{c/a}{x_1}$.`, M`Contrôle avec la somme : $x_1+x_2=-\dfrac ba$.`),
    ol(M`Les deux nombres sont les solutions de $X^2-SX+P=0$.`, M`Calcule $\Delta=S^2-4P$, puis les solutions.`, M`Si $\Delta<0$, il n’existe pas de tels nombres : réponds « aucune ».`) + pit(M`c’est bien $-S$ devant $X$ : $X^2-11X+28$ pour une somme de $11$.`),
    ol(
      M`Calcule $\Delta$ en fonction de $m$ : c’est une expression en $m$, parfois du second degré.`,
      M`Traduis la condition : une unique solution $\iff\Delta=0$ ; deux solutions distinctes $\iff\Delta>0$ ; aucune $\iff\Delta<0$.`,
      M`Résous l’équation ou l’inéquation obtenue, d’inconnue $m$.`,
    ),
  ]);
  add('q6', [
    ol(
      M`Repars de la forme canonique $a\left[\left(x+\frac b{2a}\right)^2-\frac\Delta{4a^2}\right]$ : l’axe, le sommet, le nombre de racines s’y lisent.`,
      M`Méfie-toi des réciproques : une condition suffisante n’est pas toujours nécessaire.`,
    ),
    ol(
      M`Factorise par $a$ (licite car $a\neq0$).`,
      M`Complète le carré avec la <b>moitié</b> du coefficient de $x$ : $\frac b{2a}$.`,
      M`Mets au même dénominateur $4a^2$ pour faire apparaître $\Delta$.`,
      M`Pour les racines : différence de deux carrés (possible si $\Delta\geqslant0$), puis produit nul.`,
    ) + pit(M`l’intrus classique oublie de diviser par $2$ en complétant le carré.`),
    ol(
      M`<b>Somme</b> : additionne les deux formules, les $\sqrt\Delta$ s’annulent, il reste $-\frac ba$.`,
      M`<b>Produit</b> : $(-b-\sqrt\Delta)(-b+\sqrt\Delta)=b^2-\Delta=4ac$, puis on divise par $4a^2$.`,
      M`<b>Par l’absurde</b> : suppose le contraire, déduis, et aboutis à une contradiction (par exemple un nombre à la fois pair et impair).`,
    ),
  ]);

  /* ======================= PYTHON ======================= */
  add('p1', [
    ol(
      M`Fais un tableau, avec une colonne par variable.`,
      M`Lis le programme ligne par ligne. <code>a = expr</code> : calcule <code>expr</code> avec les valeurs <b>actuelles</b>, puis écris le résultat dans la colonne de <code>a</code>.`,
      M`<code>b = a</code> <b>copie</b> la valeur : modifier <code>a</code> ensuite ne change pas <code>b</code>.`,
      M`<code>print(a, b)</code> affiche les valeurs du moment, séparées par une espace.`,
    ) + tip(M`tape exactement ce qui s’affiche, par exemple <code>18 9</code>.`),
    ol(
      M`Remplace le paramètre par la valeur donnée dans l’expression du <code>return</code>.`,
      M`Respecte les priorités : <code>**</code> d’abord, puis <code>*</code> et <code>/</code>, puis <code>+</code> et <code>-</code>.`,
      M`Pour <code>if / elif / else</code> : seul le <b>premier</b> bloc dont la condition est vraie s’exécute.`,
    ),
    ol(
      M`<code>range(a, b)</code> parcourt $a, a+1, \dots, b-1$ : il y a $b-a$ tours, et $b$ est exclu.`,
      M`Tiens un tableau avec <code>i</code> et les variables modifiées, ligne par ligne, à chaque tour.`,
      M`Pour une somme d’entiers consécutifs : (nombre de termes) $\times$ (premier $+$ dernier) $/\,2$.`,
    ) + pit(M`<code>range(4, 10)</code> s’arrête à $9$.`),
  ]);
  add('p2', [
    ol(M`<code>=</code> range une valeur ; <code>==</code> compare et vaut <code>True</code> ou <code>False</code>.`, M`<code>b*2</code> est le double ; <code>b**2</code> est le carré.`, M`La multiplication s’écrit toujours : <code>4*a*c</code>, jamais <code>4ac</code>.`),
    ol(M`<code>*</code> et <code>/</code> passent avant <code>+</code> et <code>-</code>, et se calculent de gauche à droite.`, M`<code>-b / 2*a</code> vaut $\frac{-b}{2}\times a$ : écris <code>-b / (2*a)</code>.`, M`<code>elif</code> signifie « sinon, si » : il teste un nouveau cas après un <code>if</code>.`),
    ol(
      M`Une boucle <code>while condition:</code> continue tant que la condition est vraie : pour « le premier $n$ tel que… », écris la condition <b>contraire</b>.`,
      M`Pour accumuler : initialise avant la boucle (<code>s = 0</code>), puis <code>s = s + terme</code> dans la boucle.`,
      M`Pour une suite : la nouvelle valeur se calcule à partir de l’ancienne, par exemple <code>x = (x + 2/x) / 2</code>.`,
    ),
  ]);
  add('p3', [
    ol(
      M`En haut : les <code>import</code>, puis l’initialisation des variables.`,
      M`Ensuite la boucle (<code>for</code> ou <code>while</code>), suivie de son contenu <b>indenté</b>.`,
      M`À la fin, non indenté : ce qui vient après la boucle (le <code>print</code> du résultat).`,
    ),
    ol(M`Calcule d’abord ce dont on a besoin (<code>d = b**2 - 4*a*c</code>).`, M`Traite les cas particuliers <b>avant</b> l’opération qui pourrait échouer : pas de <code>sqrt(d)</code> si <code>d &lt; 0</code>.`, M`Termine par le <code>return</code> du cas général.`),
    ol(
      M`« Multiple de $6$ <b>et</b> de $15$ » : <code>n % 6 == 0 and n % 15 == 0</code>, c’est-à-dire multiple de leur PPCM $30$.`,
      M`Dichotomie : on calcule le milieu, on garde la moitié où le signe change, et on répète tant que l’intervalle est trop grand.`,
    ) + pit(M`<code>or</code> compterait les multiples de l’un <b>ou</b> de l’autre.`),
  ]);

  /* ======================= LOGIQUE ======================= */
  add('l1', [
    ol(M`« Si $P$, alors $Q$ » n’est fausse que dans un cas : $P$ vrai et $Q$ faux.`, M`Pour la réfuter, il faut un contre-exemple qui <b>vérifie l’hypothèse</b> $P$ et contredit $Q$.`) +
      pit(M`un cas où $P$ est faux ne prouve rien : $x=-3$ ne réfute pas « si $x>2$ alors $x^2>4$ ».`),
    ol(
      M`Réciproque de $P\Rightarrow Q$ : $Q\Rightarrow P$ (elle peut être fausse).`,
      M`Contraposée : non $Q\Rightarrow$ non $P$ (toujours équivalente).`,
      M`Négation de « pour tout $x$, $P(x)$ » : « il existe $x$ tel que non $P(x)$ ».`,
      M`Négation de « $P$ et $Q$ » : « non $P$ ou non $Q$ » (et inversement).`,
    ),
    ol(
      M`« $\forall x\,\exists y$ » : pour <b>chaque</b> $x$, on peut choisir un $y$ adapté (il peut dépendre de $x$).`,
      M`« $\exists y\,\forall x$ » : un <b>même</b> $y$ doit convenir pour tous les $x$, ce qui est beaucoup plus fort.`,
      M`Pour juger une phrase, cherche un contre-exemple à la partie « pour tout ».`,
    ),
  ]);
  add('l2', [
    ol(
      M`Fais une hypothèse sur un habitant : « A est chevalier ».`,
      M`Déduis-en la valeur de vérité de sa phrase (vraie), puis ce qu’elle impose aux autres.`,
      M`Si tu aboutis à une contradiction, l’hypothèse est fausse : A est fripon.`,
      M`Vérifie la répartition finale phrase par phrase : chaque phrase est vraie si et seulement si son auteur est chevalier.`,
    ),
    ol(
      M`Commence par la phrase la plus contraignante (celle qui parle de tous, ou de celui qui la prononce).`,
      M`Personne ne peut dire « je suis un fripon » : un chevalier mentirait, un fripon dirait vrai.`,
      M`Avec trois habitants, il y a $8$ répartitions possibles : élimine-les par blocs plutôt qu’une à une.`,
    ),
    ol(
      M`« Si $P$ alors $Q$ » dite par un <b>fripon</b> est fausse : donc $P$ est vrai <b>et</b> $Q$ est faux. C’est beaucoup d’information !`,
      M`« Au moins l’un de nous est fripon » dite par un fripon serait fausse, donc tous seraient chevaliers : contradiction. Celui qui la dit est donc chevalier.`,
    ),
  ]);
  add('l3', [
    ol(
      M`Regarde comment chaque mouvement change $x+y$ (ou $x$, ou $y$).`,
      M`Si chaque mouvement change $x+y$ d’un nombre pair, la <b>parité</b> de $x+y$ ne change jamais : c’est un invariant.`,
      M`Compare la parité au départ et à l’arrivée. Différentes : arrivée inaccessible. Identiques : vérifie qu’on peut effectivement l’atteindre.`,
    ),
    ol(
      M`Avec des pas de $\pm a$ et $\pm b$, les positions atteintes sont les nombres $ma+nb$.`,
      M`Ce sont exactement les multiples de $d=\mathrm{pgcd}(a,b)$ (théorème de Bézout).`,
      M`La case est accessible si et seulement si elle est un multiple de $d$.`,
    ),
    ol(
      M`<b>Dominos</b> : colorie en damier. Chaque domino couvre une case de chaque couleur.`,
      M`Deux cases retirées de <b>même</b> couleur : impossible. De couleurs <b>différentes</b> : un pavage existe toujours (Gomory).`,
      M`<b>Réseau</b> : avec les sauts $\pm\vec u$ et $\pm\vec v$, on atteint les points $a\vec u+b\vec v$ avec $a$, $b$ <b>entiers</b>. Résous le système ; si $a$ ou $b$ n’est pas entier, le point est inaccessible.`,
    ),
  ]);
})();
