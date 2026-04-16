const Header = () => {
  return (
    <header className="container-fluid d-flex justify-content-end">
      <div className="d-flex align-items-center p-1 ">
        <div className="text-right mr-3 p-1">
          <span className="d-block m-0 p-0 text-white">Barbearia Parrudus</span>
          <small className="m-0 p-0">Plano Gold</small>
        </div>
        <img src="https://scontent.fcpq9-1.fna.fbcdn.net/v/t39.30808-6/315719312_572098928250053_778393723394280420_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEP590M05VqByPGzdtjpbs7W-xY2YZgpwZb7FjZhmCnBh7U6uc4WReA68Ey1i6vYnJLK09j_ng2iztyYBdPdp3r&_nc_ohc=aZPlhnFDd_QQ7kNvwEQcoSh&_nc_oc=AdnsepT7RUsXa6v67so2VSBt0IH-Kk6yzvnTrGLbqFZe3XNBj5-OPX2miFkQPrghzxNDm28i6RPMwtlUf31s5zfK&_nc_zt=23&_nc_ht=scontent.fcpq9-1.fna&_nc_gid=gMVJ9B0ro1dyemegy7VHFQ&oh=00_AfHsztkxtX8Jy9sx6I0aBVIt1dZMuEhHN7ACM8iBMqsnsg&oe=6808BF90" alt=""/>
        <span className="mdi mdi-chevron-down"></span>
      </div>
    </header>
  );
};

export default Header;