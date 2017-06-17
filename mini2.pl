wall(-1, -1).
isSubset([],_).
isSubset([H|T],Y):-
	member(H,Y),
	select(H,Y,Z),
	isSubset(T,Z).
equal(X,Y):-
	isSubset(X,Y),
	isSubset(Y,X).
valid(I, J):-
	rows(X), columns(Y), I < X, J < Y, I >= 0, J >= 0, \+wall(I, J).
check(_, _, PL, TH, I1, J1, PL1, TH1, S):-
	\+((pokemon(I1,J1), \+equal(PL,[(I1, J1)|PL1]))),
	\+((\+pokemon(I1,J1), \+equal(PL, PL1))),
	timeToHatch(THF), TH1 is min(TH + 1, THF),
	\+((\+timeToHatch(TH), \+(TH1 is TH + 1))),
	atState(I1, J1, PL1, TH1, S), valid(I1, J1).
atState(I, J, PL, TH, s0(I, J, PL, TH)) :-
	source(I, J, PL, TH).
atState(I, J, PL, TH, result(A, S)):-
	A = moveLeft, I1 = I, J1 is J + 1,
	check(I, J, PL, TH, I1, J1, _, _, S).
atState(I, J, PL, TH, result(A, S)):-
	A = moveUp, I1 is I + 1, J1 = J,
	check(I, J, PL, TH, I1, J1, _, _, S).
atState(I, J, PL, TH, result(A, S)):-
	A = moveRight, I1 = I, J1 is J - 1,
	check(I, J, PL, TH, I1, J1, _, _, S).
atState(I, J, PL, TH, result(A, S)):-
	A = moveDown, I1 is I - 1, J1 = J,
	check(I, J, PL, TH, I1, J1, _, _, S).
atState(I, J, PL, TH, result(A, S)):-
	atState(I, J, PL, TH, S),
		\+((A = moveLeft, Jn is J - 1, valid(I, Jn))),
		\+((A = moveDown, In is I + 1, valid(In, J))),
		\+((A = moveUp, In is I - 1, valid(In, J))),
		\+((A = moveRight, Jn is J + 1, valid(I, Jn))).

iterativeDeepening(S, D, R):-
	call_with_depth_limit(S, D, R), number(R).
iterativeDeepening(S, D, Res):-
	call_with_depth_limit(S, D, R), \+ number(R), D1 is D + 1, iterativeDeepening(S, D1, Res).
